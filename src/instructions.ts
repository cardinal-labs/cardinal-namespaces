import { withFindOrInitAssociatedTokenAccount } from "@cardinal/certificates";
import { TOKEN_MANAGER_ADDRESS } from "@cardinal/token-manager/dist/cjs/programs/tokenManager";
import {
  findMintCounterId,
  findTokenManagerAddress,
} from "@cardinal/token-manager/dist/cjs/programs/tokenManager/pda";
import * as mplTokenMetadata from "@metaplex-foundation/mpl-token-metadata";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import * as anchor from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import * as splToken from "@solana/spl-token";
import type { Connection, Transaction } from "@solana/web3.js";
import { PublicKey, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

import type { NAMESPACES_PROGRAM } from ".";
import {
  CLAIM_REQUEST_SEED,
  ENTRY_SEED,
  GLOBAL_CONTEXT_SEED,
  NAMESPACE_SEED,
  NAMESPACES_IDL,
  NAMESPACES_PROGRAM_ID,
  REVERSE_ENTRY_SEED,
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

  const [globalContextId] = await PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode(GLOBAL_CONTEXT_SEED)],
    namespacesProgram.programId
  );

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
  connection: Connection,
  wallet: Wallet,
  name: string,
  updateAuthority: PublicKey,
  rentAuthority: PublicKey,
  approveAuthority: PublicKey | null,
  schema: number,
  paymentAmountDaily: anchor.BN,
  paymentMint: PublicKey,
  minRentalSeconds: anchor.BN,
  maxRentalSeconds: anchor.BN | null,
  transferableEntries: boolean,
  transaction: Transaction
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );

  const [namespaceId, bump] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(name),
    ],
    namespacesProgram.programId
  );

  transaction.add(
    namespacesProgram.instruction.createNamespace(
      {
        bump,
        name,
        updateAuthority,
        rentAuthority,
        approveAuthority,
        schema,
        paymentAmountDaily,
        paymentMint,
        minRentalSeconds,
        maxRentalSeconds,
        transferableEntries,
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
  connection: Connection,
  wallet: Wallet,
  name: string,
  updateAuthority: PublicKey,
  rentAuthority: PublicKey,
  approveAuthority: PublicKey | null,
  paymentAmountDaily: anchor.BN,
  paymentMint: PublicKey,
  minRentalSeconds: anchor.BN,
  maxRentalSeconds: anchor.BN | null,
  transferableEntries: boolean,
  transaction: Transaction
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );

  const [namespaceId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(name),
    ],
    namespacesProgram.programId
  );

  transaction.add(
    namespacesProgram.instruction.updateNamespace(
      {
        updateAuthority,
        rentAuthority,
        approveAuthority,
        paymentAmountDaily,
        paymentMint,
        minRentalSeconds,
        maxRentalSeconds,
        transferableEntries,
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
  connection: Connection,
  wallet: Wallet,
  transaction: Transaction,
  namespaceName: string,
  entryName: string,
  mintId: PublicKey,
  duration: number,
  requestor = wallet.publicKey,
  recipient = wallet.publicKey,
  payer = wallet.publicKey
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(namespaceName),
    ],
    namespacesProgram.programId
  );

  const [entryId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(ENTRY_SEED),
      namespaceId.toBytes(),
      anchor.utils.bytes.utf8.encode(entryName),
    ],
    namespacesProgram.programId
  );

  const [claimRequestId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(CLAIM_REQUEST_SEED),
      namespaceId.toBytes(),
      anchor.utils.bytes.utf8.encode(entryName),
      provider.wallet.publicKey.toBytes(),
    ],
    namespacesProgram.programId
  );

  const [tokenManagerId] = await findTokenManagerAddress(mintId);

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
    recipient,
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
    duration > 0 ? duration : 0
  );

  transaction.add(
    namespacesProgram.instruction.claimNameEntry(
      {
        duration: duration > 0 ? new anchor.BN(duration) : null,
      },
      {
        accounts: {
          namespace: namespaceId,
          nameEntry: entryId,
          requestor: requestor,
          recipient: recipient,
          payer: payer,
          claimRequest: claimRequestId,
          mint: mintId,
          namespaceTokenAccount: namespaceTokenAccountId,
          tokenManager: tokenManagerId,
          tokenManagerTokenAccount: tokenManagerTokenAccountId,
          mintCounter: mintCounterId,
          recipientTokenAccount: recipientTokenAccount,

          // programs
          tokenManagerProgram: TOKEN_MANAGER_ADDRESS,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          associatedToken: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        remainingAccounts: remainingAccountsForClaim,
      }
    )
  );
  return transaction;
}

export async function withInitNameEntry(
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  transaction: Transaction
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );

  const [namespaceId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(namespaceName),
    ],
    namespacesProgram.programId
  );

  const [entryId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(ENTRY_SEED),
      namespaceId.toBytes(),
      anchor.utils.bytes.utf8.encode(entryName),
    ],
    namespacesProgram.programId
  );

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

export async function withRevokeNameEntry(
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  mintId: PublicKey,
  claimRequestId: PublicKey,
  transaction: Transaction
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(namespaceName),
    ],
    namespacesProgram.programId
  );

  const [entryId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(ENTRY_SEED),
      namespaceId.toBytes(),
      anchor.utils.bytes.utf8.encode(entryName),
    ],
    namespacesProgram.programId
  );

  const namespace = await namespacesProgram.account.namespace.fetch(
    namespaceId
  );

  const [tokenManagerId] = await findTokenManagerAddress(mintId);
  const tokenManagerTokenAccount = await withFindOrInitAssociatedTokenAccount(
    transaction,
    connection,
    mintId,
    tokenManagerId,
    wallet.publicKey,
    true
  );

  const userRecipientTokenAccount = await withFindOrInitAssociatedTokenAccount(
    transaction,
    provider.connection,
    namespace.paymentMint,
    provider.wallet.publicKey,
    provider.wallet.publicKey,
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
        userRecipientTokenAccount: userRecipientTokenAccount,

        // programs
        tokenManagerProgram: TOKEN_MANAGER_ADDRESS,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      },
    })
  );
  return transaction;
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
  const [namespaceId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(namespaceName),
    ],
    namespacesProgram.programId
  );

  const [entryId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(ENTRY_SEED),
      namespaceId.toBytes(),
      anchor.utils.bytes.utf8.encode(entryName),
    ],
    namespacesProgram.programId
  );

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
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  certificateMintId: PublicKey,
  transaction: Transaction,
  mintId: PublicKey
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(namespaceName),
    ],
    namespacesProgram.programId
  );

  const [entryId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(ENTRY_SEED),
      namespaceId.toBytes(),
      anchor.utils.bytes.utf8.encode(entryName),
    ],
    namespacesProgram.programId
  );

  const [reverseEntryId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(REVERSE_ENTRY_SEED),
      wallet.publicKey.toBytes(),
    ],
    namespacesProgram.programId
  );

  const userTokenAccountId = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    mintId,
    provider.wallet.publicKey
  );
  const [tokenManagerId] = await findTokenManagerAddress(certificateMintId);

  transaction.add(
    namespacesProgram.instruction.setNamespaceReverseEntry({
      accounts: {
        namespace: namespaceId,
        nameEntry: entryId,
        reverseEntry: reverseEntryId,

        userTokenAccount: userTokenAccountId,
        tokenManager: tokenManagerId,

        user: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
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
  const [namespaceId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(namespaceName),
    ],
    namespacesProgram.programId
  );

  const [claimRequestId, claimRequestBump] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(CLAIM_REQUEST_SEED),
      namespaceId.toBytes(),
      anchor.utils.bytes.utf8.encode(entryName),
      user.toBytes(),
    ],
    namespacesProgram.programId
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
  const [namespaceId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(namespaceName),
    ],
    namespacesProgram.programId
  );
  transaction.add(
    namespacesProgram.instruction.updateClaimRequest(isApproved, {
      accounts: {
        namespace: namespaceId,
        approveAuthority: provider.wallet.publicKey,
        rentRequest: rentRequestId,
      },
    })
  );
  return transaction;
}

export async function withRevokeReverseEntry(
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  reverseEntryId: PublicKey,
  claimRequestId: PublicKey,
  transaction: Transaction
): Promise<Transaction> {
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(namespaceName),
    ],
    namespacesProgram.programId
  );

  const [nameEntryId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(ENTRY_SEED),
      namespaceId.toBytes(),
      anchor.utils.bytes.utf8.encode(entryName),
    ],
    namespacesProgram.programId
  );

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
