import { withFindOrInitAssociatedTokenAccount } from "@cardinal/certificates";
import { findAta } from "@cardinal/common";
import {
  getRemainingAccountsForKind,
  InvalidationType,
  TOKEN_MANAGER_ADDRESS,
  TokenManagerKind,
  withRemainingAccountsForReturn,
} from "@cardinal/token-manager/dist/cjs/programs/tokenManager";
import { getTokenManager } from "@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts";
import {
  findMintCounterId,
  findTokenManagerAddress,
} from "@cardinal/token-manager/dist/cjs/programs/tokenManager/pda";
import * as mplTokenMetadata from "@metaplex-foundation/mpl-token-metadata";
import {
  MasterEdition,
  Metadata,
} from "@metaplex-foundation/mpl-token-metadata";
import * as anchor from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import * as splToken from "@solana/spl-token";
import type { Connection, Keypair, Transaction } from "@solana/web3.js";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

import type { NAMESPACES_PROGRAM } from ".";
import {
  findClaimRequestId,
  findGlobalContextId,
  findNameEntryId,
  findNamespaceId,
  findReverseEntryId,
  getNameEntry,
  getNamespace,
  NAMESPACES_IDL,
  NAMESPACES_PROGRAM_ID,
  withRemainingAccountsForClaim,
} from ".";

export async function withInit(
  connection: Connection,
  wallet: Wallet,
  rentalPercentage: number,
  transaction: Transaction
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );

  const [globalContextId] = await findGlobalContextId();

  transaction.add(
    namespacesProgram.instruction.initGlobalContext(
      {
        feeBasisPoints: new anchor.BN(rentalPercentage),
      },
      {
        accounts: {
          globalContext: globalContextId,
          authority: provider.wallet.publicKey,
          payer: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    )
  );
  return transaction;
}

export async function withCreateNamespace(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    namespaceName: string;
    schema?: number;
    updateAuthority: PublicKey;
    rentAuthority: PublicKey;
    approveAuthority?: PublicKey;
    paymentAmountDaily?: anchor.BN;
    paymentMint?: PublicKey;
    minRentalSeconds?: anchor.BN;
    maxRentalSeconds?: anchor.BN;
    transferableEntries: boolean;
    limit?: number;
    maxExpiration?: anchor.BN;
    invalidationType?: InvalidationType;
  }
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );

  const [namespaceId] = await findNamespaceId(params.namespaceName);

  transaction.add(
    namespacesProgram.instruction.createNamespace(
      {
        name: params.namespaceName,
        updateAuthority: params.updateAuthority,
        rentAuthority: params.rentAuthority,
        approveAuthority: params.approveAuthority ?? null,
        schema: params.schema ?? 0,
        paymentAmountDaily: params.paymentAmountDaily ?? new anchor.BN(0),
        paymentMint: params.paymentMint ?? PublicKey.default,
        minRentalSeconds: params.minRentalSeconds ?? new anchor.BN(0),
        maxRentalSeconds: params.maxRentalSeconds ?? null,
        transferableEntries: params.transferableEntries,
        limit: params.limit ?? null,
        maxExpiration: params.maxExpiration ?? null,
        invalidationType:
          params.invalidationType ?? params.transferableEntries
            ? InvalidationType.Invalidate
            : InvalidationType.Return,
      },
      {
        accounts: {
          namespace: namespaceId,
          authority: provider.wallet.publicKey,
          payer: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    )
  );
  return transaction;
}

export async function withUpdateNamespace(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  params: {
    updateAuthority?: PublicKey;
    rentAuthority?: PublicKey;
    approveAuthority?: PublicKey;
    paymentAmountDaily?: anchor.BN;
    paymentMint?: PublicKey;
    minRentalSeconds?: anchor.BN;
    maxRentalSeconds?: anchor.BN;
    transferableEntries?: boolean;
    limit?: number;
    maxExpiration?: anchor.BN;
  }
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );

  const [namespaceId] = await findNamespaceId(namespaceName);
  transaction.add(
    namespacesProgram.instruction.updateNamespace(
      {
        updateAuthority: params.updateAuthority ?? null,
        rentAuthority: params.rentAuthority ?? null,
        approveAuthority: params.approveAuthority ?? null,
        paymentAmountDaily: params.paymentAmountDaily ?? null,
        paymentMint: params.paymentMint ?? null,
        minRentalSeconds: params.minRentalSeconds ?? null,
        maxRentalSeconds: params.maxRentalSeconds ?? null,
        transferableEntries: params.transferableEntries ?? null,
        limit: params.limit ?? null,
        maxExpiration: params.maxExpiration ?? null,
      },
      {
        accounts: {
          namespace: namespaceId,
          updateAuthority: provider.wallet.publicKey,
        },
      }
    )
  );
  return transaction;
}

export async function withClaimNameEntry(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  mintId: PublicKey,
  duration?: number,
  requestor = wallet.publicKey,
  payer = wallet.publicKey
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(namespaceName);
  const [entryId] = await findNameEntryId(namespaceId, entryName);
  const [claimRequestId] = await findClaimRequestId(
    namespaceId,
    entryName,
    requestor
  );
  const [tokenManagerId] = await findTokenManagerAddress(mintId);

  const namespace = await getNamespace(connection, namespaceId);

  const namespaceTokenAccountId =
    await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      mintId,
      namespaceId,
      true
    );

  const tokenManagerTokenAccountId =
    await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      mintId,
      tokenManagerId,
      true
    );

  const recipientTokenAccount = await withFindOrInitAssociatedTokenAccount(
    transaction,
    provider.connection,
    mintId,
    wallet.publicKey,
    payer,
    true
  );

  const [mintCounterId] = await findMintCounterId(mintId);

  const remainingAccountsForClaim = await withRemainingAccountsForClaim(
    connection,
    transaction,
    wallet,
    namespaceId,
    tokenManagerId,
    duration && duration > 0 ? duration : undefined
  );

  const remainingAccountsForKind = await getRemainingAccountsForKind(
    mintId,
    namespace.parsed.transferableEntries
      ? TokenManagerKind.Unmanaged
      : TokenManagerKind.Edition
  );

  transaction.add(
    namespacesProgram.instruction.claimNameEntry(
      {
        duration: duration && duration > 0 ? new anchor.BN(duration) : null,
      },
      {
        accounts: {
          namespace: namespaceId,
          nameEntry: entryId,
          requestor: requestor,
          recipient: wallet.publicKey,
          payer: payer,
          claimRequest: claimRequestId,
          mint: mintId,
          namespaceTokenAccount: namespaceTokenAccountId,
          tokenManager: tokenManagerId,
          tokenManagerTokenAccount: tokenManagerTokenAccountId,
          mintCounter: mintCounterId,
          recipientTokenAccount: recipientTokenAccount,
          tokenManagerProgram: TOKEN_MANAGER_ADDRESS,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          associatedToken: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        remainingAccounts: [
          ...remainingAccountsForClaim,
          ...remainingAccountsForKind,
        ],
      }
    )
  );
  return transaction;
}

export async function withInitNameEntry(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );

  const [namespaceId] = await findNamespaceId(namespaceName);
  const [entryId] = await findNameEntryId(namespaceId, entryName);

  transaction.add(
    namespacesProgram.instruction.initNameEntry(
      {
        name: entryName,
      },
      {
        accounts: {
          namespace: namespaceId,
          nameEntry: entryId,
          payer: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    )
  );
  return transaction;
}

export async function withInitNameEntryMint(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  mintKeypair: Keypair
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );

  const [namespaceId] = await findNamespaceId(namespaceName);
  const [entryId] = await findNameEntryId(namespaceId, entryName);

  const namespaceTokenAccountId =
    await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      namespaceId,
      true
    );

  const mintMetadataId = await Metadata.getPDA(mintKeypair.publicKey);
  const mintMasterEditionId = await MasterEdition.getPDA(mintKeypair.publicKey);

  transaction.add(
    namespacesProgram.instruction.initNameEntryMint({
      accounts: {
        namespace: namespaceId,
        nameEntry: entryId,
        payer: provider.wallet.publicKey,
        namespaceTokenAccount: namespaceTokenAccountId,
        mint: mintKeypair.publicKey,
        mintMetadata: mintMetadataId,
        masterEdition: mintMasterEditionId,
        tokenMetadataProgram: mplTokenMetadata.MetadataProgram.PUBKEY,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        associatedToken: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
      },
    })
  );
  return transaction;
}

export async function withRevokeNameEntry(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  mintId: PublicKey,
  claimRequestId: PublicKey
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(namespaceName);
  const [entryId] = await findNameEntryId(namespaceId, entryName);

  const nameEntry = await getNameEntry(connection, namespaceName, entryName);
  const [tokenManagerId] = await findTokenManagerAddress(mintId);
  const tokenManagerData = await getTokenManager(connection, tokenManagerId);

  const tokenManagerTokenAccount = await withFindOrInitAssociatedTokenAccount(
    transaction,
    connection,
    mintId,
    tokenManagerId,
    wallet.publicKey,
    true
  );

  const recipientTokenAccount = await findAta(
    nameEntry.parsed.mint,
    provider.wallet.publicKey,
    true
  );

  const remainingAccountsForKind = await getRemainingAccountsForKind(
    mintId,
    TokenManagerKind.Edition
  );

  const remainingAccountsForReturn = await withRemainingAccountsForReturn(
    transaction,
    connection,
    wallet,
    tokenManagerData,
    true
  );

  transaction.add(
    namespacesProgram.instruction.revokeNameEntry({
      accounts: {
        namespace: namespaceId,
        nameEntry: entryId,
        claimRequest: claimRequestId,
        invalidator: provider.wallet.publicKey,
        tokenManager: tokenManagerId,
        mint: mintId,
        tokenManagerTokenAccount: tokenManagerTokenAccount,
        recipientTokenAccount: recipientTokenAccount,
        tokenManagerProgram: TOKEN_MANAGER_ADDRESS,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      },
      remainingAccounts: [
        ...remainingAccountsForKind,
        ...remainingAccountsForReturn,
      ],
    })
  );
  return transaction;
}

export async function withInvalidateExpiredNameEntry(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    namespaceName: string;
    mintId: PublicKey;
    entryName: string;
    invalidator?: PublicKey;
  }
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(params.namespaceName);
  const [nameEntryId] = await findNameEntryId(namespaceId, params.entryName);
  const namespaceTokenAccountId = await findAta(
    params.mintId,
    namespaceId,
    true
  );
  transaction.add(
    namespacesProgram.instruction.invalidateExpiredNameEntry({
      accounts: {
        namespace: namespaceId,
        nameEntry: nameEntryId,
        namespaceTokenAccount: namespaceTokenAccountId,
        invalidator: params.invalidator || namespaceId,
      },
    })
  );
  return transaction;
}

export async function withInvalidateTransferableNameEntry(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    namespaceName: string;
    mintId: PublicKey;
    entryName: string;
    invalidator?: PublicKey;
  }
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(params.namespaceName);
  const [nameEntryId] = await findNameEntryId(namespaceId, params.entryName);
  const [tokenManagerId] = await findTokenManagerAddress(params.mintId);
  transaction.add(
    namespacesProgram.instruction.invalidateTransferableNameEntry({
      accounts: {
        namespace: namespaceId,
        nameEntry: nameEntryId,
        tokenManager: tokenManagerId,
        invalidator: params.invalidator || namespaceId,
      },
    })
  );
  return transaction;
}

export async function withInvalidateNameEntry(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    namespaceName: string;
    mintId: PublicKey;
    entryName: string;
    invalidator?: PublicKey;
    transferable: boolean;
  }
): Promise<Transaction> {
  if (params.transferable) {
    return withInvalidateTransferableNameEntry(
      transaction,
      connection,
      wallet,
      params
    );
  } else {
    return withInvalidateExpiredNameEntry(
      transaction,
      connection,
      wallet,
      params
    );
  }
}

export async function withSetEntryData(
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  mintId: PublicKey,
  transaction: Transaction
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(namespaceName);
  const [entryId] = await findNameEntryId(namespaceId, entryName);

  const entry = await namespacesProgram.account.entry.fetch(entryId);
  const [tokenManagerId] = await findTokenManagerAddress(mintId);

  const userTokenAccountId = await withFindOrInitAssociatedTokenAccount(
    transaction,
    provider.connection,
    entry.mint,
    provider.wallet.publicKey,
    provider.wallet.publicKey
  );

  transaction.add(
    namespacesProgram.instruction.setNameEntryData({
      accounts: {
        namespace: namespaceId,
        nameEntry: entryId,

        userTokenAccount: userTokenAccountId,
        tokenManager: tokenManagerId,

        user: provider.wallet.publicKey,
      },
    })
  );
  return transaction;
}

export async function withSetNamespaceReverseEntry(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  mintId: PublicKey,
  payer = wallet.publicKey
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(namespaceName);
  const [entryId] = await findNameEntryId(namespaceId, entryName);
  const [reverseEntryId] = await findReverseEntryId(
    namespaceId,
    wallet.publicKey
  );

  const userTokenAccountId = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    mintId,
    provider.wallet.publicKey
  );
  const [tokenManagerId] = await findTokenManagerAddress(mintId);
  transaction.add(
    namespacesProgram.instruction.setNamespaceReverseEntry({
      accounts: {
        namespace: namespaceId,
        nameEntry: entryId,
        reverseEntry: reverseEntryId,
        userTokenAccount: userTokenAccountId,
        tokenManager: tokenManagerId,
        user: provider.wallet.publicKey,
        payer: payer,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    })
  );
  return transaction;
}

export async function withCreateClaimRequest(
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  user: PublicKey,
  transaction: Transaction
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(namespaceName);
  const [claimRequestId, claimRequestBump] = await findClaimRequestId(
    namespaceId,
    entryName,
    user
  );

  transaction.add(
    namespacesProgram.instruction.createClaimRequest(
      entryName,
      claimRequestBump,
      user,
      {
        accounts: {
          namespace: namespaceId,
          payer: provider.wallet.publicKey,
          claimRequest: claimRequestId,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    )
  );
  return transaction;
}

export async function withUpdateClaimRequest(
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  rentRequestId: PublicKey,
  isApproved: boolean,
  transaction: Transaction
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(namespaceName);
  const [nameEntryId] = await findNameEntryId(namespaceId, entryName);
  transaction.add(
    namespacesProgram.instruction.updateClaimRequest(isApproved, {
      accounts: {
        nameEntry: nameEntryId,
        namespace: namespaceId,
        approveAuthority: provider.wallet.publicKey,
        rentRequest: rentRequestId,
      },
    })
  );
  return transaction;
}

export async function withRevokeReverseEntry(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  reverseEntryId: PublicKey,
  claimRequestId: PublicKey
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(namespaceName);
  const [nameEntryId] = await findNameEntryId(namespaceId, entryName);
  transaction.add(
    namespacesProgram.instruction.revokeReverseEntry({
      accounts: {
        namespace: namespaceId,
        nameEntry: nameEntryId,
        reverseEntry: reverseEntryId,
        claimRequest: claimRequestId,
        invalidator: wallet.publicKey,
      },
    })
  );
  return transaction;
}

export async function withInvalidateExpiredReverseEntry(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    namespaceName: string;
    mintId: PublicKey;
    entryName: string;
    reverseEntryId: PublicKey;
    invalidator?: PublicKey;
  }
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(params.namespaceName);
  const [nameEntryId] = await findNameEntryId(namespaceId, params.entryName);
  const namespaceTokenAccountId = await findAta(
    params.mintId,
    namespaceId,
    true
  );
  transaction.add(
    namespacesProgram.instruction.invalidateExpiredReverseEntry({
      accounts: {
        namespace: namespaceId,
        nameEntry: nameEntryId,
        namespaceTokenAccount: namespaceTokenAccountId,
        reverseNameEntry: params.reverseEntryId,
        invalidator: params.invalidator || namespaceId,
      },
    })
  );
  return transaction;
}

export async function withInvalidateTransferableReverseEntry(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    namespaceName: string;
    mintId: PublicKey;
    entryName: string;
    reverseEntryId: PublicKey;
    invalidator?: PublicKey;
  }
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(params.namespaceName);
  const [nameEntryId] = await findNameEntryId(namespaceId, params.entryName);
  const [tokenManagerId] = await findTokenManagerAddress(params.mintId);
  transaction.add(
    namespacesProgram.instruction.invalidateTransferableReverseEntry({
      accounts: {
        namespace: namespaceId,
        nameEntry: nameEntryId,
        tokenManager: tokenManagerId,
        reverseNameEntry: params.reverseEntryId,
        invalidator: params.invalidator || namespaceId,
      },
    })
  );
  return transaction;
}

export async function withInvalidateReverseEntry(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    namespaceName: string;
    mintId: PublicKey;
    entryName: string;
    reverseEntryId: PublicKey;
    invalidator?: PublicKey;
    transferable: boolean;
  }
): Promise<Transaction> {
  if (params.transferable) {
    return withInvalidateTransferableReverseEntry(
      transaction,
      connection,
      wallet,
      params
    );
  } else {
    return withInvalidateExpiredReverseEntry(
      transaction,
      connection,
      wallet,
      params
    );
  }
}

export async function withUpdateMintMetadata(
  connection: Connection,
  wallet: Wallet,
  namespaceId: PublicKey,
  entryId: PublicKey,
  mintId: PublicKey,
  transaction: Transaction
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );

  const mintMetadataId = await Metadata.getPDA(mintId);
  transaction.add(
    namespacesProgram.instruction.updateNameEntryMintMetadata({
      accounts: {
        namespace: namespaceId,
        updateAuthority: provider.wallet.publicKey,
        nameEntry: entryId,
        mintMetadata: mintMetadataId,
        tokenMetadataProgram: mplTokenMetadata.MetadataProgram.PUBKEY,
      },
    })
  );
  return transaction;
}

export function withCloseNameEntry(
  connection: Connection,
  wallet: Wallet,
  namespaceId: PublicKey,
  transaction: Transaction
): Transaction {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );

  transaction.add(
    namespacesProgram.instruction.closeNameEntry({
      accounts: {
        namespace: namespaceId,
        invalidator: wallet.publicKey,
      },
    })
  );
  return transaction;
}
