import type { CertificateData } from "@cardinal/certificates";
import { certificateIdForMint, getCertificate } from "@cardinal/certificates";
import type { AccountData } from "@cardinal/token-manager";
import {
  timeInvalidator,
  tokenManager,
  useInvalidator,
} from "@cardinal/token-manager/dist/cjs/programs";
import type { TimeInvalidatorData } from "@cardinal/token-manager/dist/cjs/programs/timeInvalidator";
import type { TokenManagerData } from "@cardinal/token-manager/dist/cjs/programs/tokenManager";
import { findTokenManagerAddress } from "@cardinal/token-manager/dist/cjs/programs/tokenManager/pda";
import type { UseInvalidatorData } from "@cardinal/token-manager/dist/cjs/programs/useInvalidator";
import * as metaplex from "@metaplex-foundation/mpl-token-metadata";
import * as anchor from "@project-serum/anchor";
import type {
  AccountInfo,
  Connection,
  ParsedAccountData,
} from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import fetch from "node-fetch";

export type TokenData = {
  tokenAccount?: {
    pubkey: PublicKey;
    account: AccountInfo<ParsedAccountData>;
  };
  tokenManagerData?: AccountData<TokenManagerData> | null;
  metaplexData?: metaplex.Metadata | null;
  useInvalidatorData?: AccountData<UseInvalidatorData> | null;
  timeInvalidatorData?: AccountData<TimeInvalidatorData> | null;
  certificateData?: AccountData<CertificateData> | null;
  metadata?: { pubkey: PublicKey; data: any };
};

export async function getTokenData(
  connection: Connection,
  mintId: PublicKey,
  getMetadata = false
): Promise<TokenData> {
  const [[metaplexId], [tokenManagerId], [certificateId]] = await Promise.all([
    PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(metaplex.MetadataProgram.PREFIX),
        metaplex.MetadataProgram.PUBKEY.toBuffer(),
        mintId.toBuffer(),
      ],
      metaplex.MetadataProgram.PUBKEY
    ),
    findTokenManagerAddress(mintId),
    certificateIdForMint(mintId),
  ]);

  const [[timeInvalidatorId], [useInvalidatorId]] = await Promise.all([
    timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId),
    useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId),
  ]);

  const [
    metaplexData,
    tokenManagerData,
    timeInvalidatorData,
    useInvalidatorData,
    certificateData,
  ] = await Promise.all([
    metaplex.Metadata.load(connection, metaplexId).catch((e) => {
      console.log("Failed to get metaplex data", e);
      return null;
    }),
    tokenManager.accounts
      .getTokenManager(connection, tokenManagerId)
      .catch((e) => {
        console.log("Failed to get token manager data", e);
        return null;
      }),
    timeInvalidator.accounts
      .getTimeInvalidator(connection, timeInvalidatorId)
      .catch((e) => {
        console.log("Failed to get time invalidator data", e);
        return null;
      }),
    useInvalidator.accounts
      .getUseInvalidator(connection, useInvalidatorId)
      .catch((e) => {
        console.log("Failed to get use invalidator data", e);
        return null;
      }),
    getCertificate(connection, certificateId).catch((e) => {
      console.log("Failed to get certificate data", e);
      return null;
    }),
  ]);

  let metadata: any | null = null;
  if (
    metaplexData &&
    getMetadata &&
    !metaplexData.data.data.uri.includes("cardinal")
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = await fetch(metaplexData.data.data.uri).then((r) =>
        r.json()
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      metadata = { pubkey: metaplexData.pubkey, data: json };
    } catch (e) {
      console.log("Failed to get metadata data", e);
    }
  }

  return {
    metaplexData,
    tokenManagerData,
    useInvalidatorData,
    timeInvalidatorData,
    certificateData,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    metadata,
  };
}
