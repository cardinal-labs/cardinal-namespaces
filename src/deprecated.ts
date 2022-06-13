import * as certificate from "@cardinal/certificates";
import {
  CERTIFICATE_PROGRAM_ID,
  CERTIFICATE_SEED,
  MINT_MANAGER_SEED,
} from "@cardinal/certificates";
import { withFindOrInitAssociatedTokenAccount } from "@cardinal/common";
import * as mplTokenMetadata from "@metaplex-foundation/mpl-token-metadata";
import * as anchor from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import * as splToken from "@solana/spl-token";
import type { Connection, Transaction } from "@solana/web3.js";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

import type { NAMESPACES_PROGRAM } from "./constants";
import {
  CLAIM_REQUEST_SEED,
  ENTRY_SEED,
  NAMESPACE_SEED,
  NAMESPACES_IDL,
  NAMESPACES_PROGRAM_ID,
  REVERSE_ENTRY_SEED,
} from "./constants";

export async function withClaimEntry(
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  certificateMintId: PublicKey,
  duration: number,
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

  const [claimRequestId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(CLAIM_REQUEST_SEED),
      namespaceId.toBytes(),
      anchor.utils.bytes.utf8.encode(entryName),
      provider.wallet.publicKey.toBytes(),
    ],
    namespacesProgram.programId
  );

  const namespace = await namespacesProgram.account.namespace.fetch(
    namespaceId
  );

  const [certificateId, certificateBump] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(CERTIFICATE_SEED),
      certificateMintId.toBuffer(),
    ],
    CERTIFICATE_PROGRAM_ID
  );

  const [mintManagerId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(MINT_MANAGER_SEED),
      certificateMintId.toBytes(),
    ],
    CERTIFICATE_PROGRAM_ID
  );

  const namespaceCertificateTokenAccountId =
    await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      certificateMintId,
      namespaceId,
      true
    );

  const certificatePaymentTokenAccountId =
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      provider.connection,
      namespace.paymentMint,
      certificateId,
      provider.wallet.publicKey,
      true
    );

  const userCertificateTokenAccountId =
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      provider.connection,
      certificateMintId,
      provider.wallet.publicKey,
      provider.wallet.publicKey
    );

  const userPaymentTokenAccountId = await withFindOrInitAssociatedTokenAccount(
    transaction,
    provider.connection,
    namespace.paymentMint,
    provider.wallet.publicKey,
    provider.wallet.publicKey
  );

  const certificateTokenAccountId =
    await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      certificateMintId,
      certificateId,
      true
    );
  transaction.add(
    namespacesProgram.instruction.claimEntry(
      {
        duration: duration > 0 ? new anchor.BN(duration) : null,
        certificateBump,
      },
      {
        accounts: {
          namespace: namespaceId,
          entry: entryId,
          user: provider.wallet.publicKey,
          payer: provider.wallet.publicKey,
          paymentMint: namespace.paymentMint,
          claimRequest: claimRequestId,

          // CPI accounts
          mintManager: mintManagerId,
          certificate: certificateId,
          certificateMint: certificateMintId,
          certificateTokenAccount: certificateTokenAccountId,
          certificatePaymentTokenAccount: certificatePaymentTokenAccountId,
          userCertificateTokenAccount: userCertificateTokenAccountId,
          userPaymentTokenAccount: userPaymentTokenAccountId,
          namespaceCertificateTokenAccount: namespaceCertificateTokenAccountId,

          // programs
          certificateProgram: CERTIFICATE_PROGRAM_ID,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          associatedToken: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    )
  );
  return transaction;
}

export async function withInitEntry(
  connection: Connection,
  wallet: Wallet,
  certificateMintId: PublicKey,
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

  const [entryId, entryBump] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(ENTRY_SEED),
      namespaceId.toBytes(),
      anchor.utils.bytes.utf8.encode(entryName),
    ],
    namespacesProgram.programId
  );

  const [mintManagerId, mintManagerBump] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(MINT_MANAGER_SEED),
      certificateMintId.toBytes(),
    ],
    CERTIFICATE_PROGRAM_ID
  );

  const [certificateMintMetadataId] = await PublicKey.findProgramAddress(
    [
      Buffer.from(mplTokenMetadata.MetadataProgram.PREFIX),
      mplTokenMetadata.MetadataProgram.PUBKEY.toBuffer(),
      certificateMintId.toBuffer(),
    ],
    mplTokenMetadata.MetadataProgram.PUBKEY
  );

  const mintBalanceNeeded = await splToken.Token.getMinBalanceRentForExemptMint(
    provider.connection
  );

  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: certificateMintId,
      lamports: mintBalanceNeeded,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      space: splToken.MintLayout.span,
      programId: splToken.TOKEN_PROGRAM_ID,
    })
  );

  const namespaceCertificateTokenAccountId =
    await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      certificateMintId,
      namespaceId,
      true
    );

  transaction.add(
    namespacesProgram.instruction.initEntry(
      {
        name: entryName,
        entryBump,
        mintManagerBump,
      },
      {
        accounts: {
          namespace: namespaceId,
          entry: entryId,
          payer: provider.wallet.publicKey,
          namespaceCertificateTokenAccount: namespaceCertificateTokenAccountId,

          // cpi
          mintManager: mintManagerId,
          certificateMint: certificateMintId,
          certificateMintMetadata: certificateMintMetadataId,

          // programs
          certificateProgram: CERTIFICATE_PROGRAM_ID,
          tokenMetadataProgram: mplTokenMetadata.MetadataProgram.PUBKEY,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          associatedToken: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    )
  );
  return transaction;
}

export async function withRevokeEntry(
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  certificateMintId: PublicKey,
  certificateOwnerId: PublicKey,
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

  const [certificateId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(CERTIFICATE_SEED),
      certificateMintId.toBuffer(),
    ],
    CERTIFICATE_PROGRAM_ID
  );

  const [mintManagerId] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(MINT_MANAGER_SEED),
      certificateMintId.toBytes(),
    ],
    CERTIFICATE_PROGRAM_ID
  );

  const namespaceCertificateTokenAccountId =
    await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      certificateMintId,
      namespaceId,
      true
    );

  const namespacePaymentTokenAccountId =
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      provider.connection,
      namespace.paymentMint,
      namespaceId,
      provider.wallet.publicKey,
      true
    );

  const certificatePaymentTokenAccountId =
    await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      namespace.paymentMint,
      certificateId,
      true
    );

  const userCertificateTokenAccountId =
    await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      certificateMintId,
      certificateOwnerId
    );

  const userPaymentTokenAccountId = await withFindOrInitAssociatedTokenAccount(
    transaction,
    provider.connection,
    namespace.paymentMint,
    certificateOwnerId,
    provider.wallet.publicKey
  );

  const certificateTokenAccountId =
    await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      certificateMintId,
      certificateId,
      true
    );

  transaction.add(
    namespacesProgram.instruction.revokeEntry({
      accounts: {
        namespace: namespaceId,
        entry: entryId,
        claimRequest: claimRequestId,
        namespaceCertificateTokenAccount: namespaceCertificateTokenAccountId,
        namespacePaymentTokenAccount: namespacePaymentTokenAccountId,
        invalidator: provider.wallet.publicKey,

        // CPI accounts
        mintManager: mintManagerId,
        certificate: certificateId,
        certificateMint: certificateMintId,
        certificateTokenAccount: certificateTokenAccountId,
        certificatePaymentTokenAccount: certificatePaymentTokenAccountId,
        userCertificateTokenAccount: userCertificateTokenAccountId,
        userPaymentTokenAccount: userPaymentTokenAccountId,

        // programs
        certificateProgram: CERTIFICATE_PROGRAM_ID,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
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
  entryData: PublicKey,
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
  const [certificateId] = await certificate.certificateIdForMint(entry.mint);

  const userCertificateTokenAccountId =
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      provider.connection,
      entry.mint,
      provider.wallet.publicKey,
      provider.wallet.publicKey
    );

  transaction.add(
    namespacesProgram.instruction.setEntryData(entryData, {
      accounts: {
        namespace: namespaceId,
        entry: entryId,

        userCertificateTokenAccount: userCertificateTokenAccountId,
        certificate: certificateId,

        user: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    })
  );
  return transaction;
}

export async function withSetReverseEntry(
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  certificateMintId: PublicKey,
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

  const [reverseEntryId, reverseEntryBump] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(REVERSE_ENTRY_SEED),
      wallet.publicKey.toBytes(),
    ],
    namespacesProgram.programId
  );

  const [certificateId] = await certificate.certificateIdForMint(
    certificateMintId
  );

  const userCertificateTokenAccountId =
    await splToken.Token.getAssociatedTokenAddress(
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      splToken.TOKEN_PROGRAM_ID,
      certificateMintId,
      provider.wallet.publicKey
    );

  transaction.add(
    namespacesProgram.instruction.setReverseEntry(reverseEntryBump, {
      accounts: {
        namespace: namespaceId,
        entry: entryId,
        reverseEntry: reverseEntryId,

        userCertificateTokenAccount: userCertificateTokenAccountId,
        certificate: certificateId,

        user: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    })
  );
  return transaction;
}
