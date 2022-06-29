/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { emptyWallet } from "@cardinal/common";
import {
  deprecated,
  findClaimRequestId,
  findNamespaceId,
  shortenAddress,
  withCreateClaimRequest,
  withRevokeReverseEntry,
  withUpdateClaimRequest,
} from "@cardinal/namespaces";
import * as anchor from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

import { connectionFor } from "../common/connection";
import {
  tryGetAta,
  tryGetClaimRequest,
  tryGetNameEntry,
  tweetContainsPublicKey,
} from "./utils";

// twtQEtj1wnNmSZZ475prwBFPbPit6w88YSfjia83g4k
const WALLET = Keypair.fromSecretKey(
  anchor.utils.bytes.bs58.decode(process.env.TWITTER_SOLANA_KEY || "")
);

const NAMESPACE_NAME = "twitter";

export async function claimTransaction(
  tweetId: string,
  publicKey: string,
  entryName: string,
  cluster = "mainnet"
): Promise<{ status: number; transaction?: string; message?: string }> {
  console.log(
    `Attempting to approve tweet for tweet (${tweetId}) publicKey ${publicKey} entryName ${entryName} cluster ${cluster} `
  );
  const connection = connectionFor(cluster);

  // check tweet
  let tweetApproved = true;
  if (cluster !== "devnet") {
    try {
      tweetApproved = await tweetContainsPublicKey(
        tweetId,
        entryName,
        publicKey
      );
    } catch (e) {
      console.log("Failed twitter check: ", e);
      return {
        status: 401,
        message: e.message,
      };
    }
  }

  if (!tweetApproved) {
    return {
      status: 404,
      message: `Public key ${shortenAddress(
        publicKey
      )} not found in tweet ${tweetId}`,
    };
  }

  const [namespaceId] = await findNamespaceId(NAMESPACE_NAME);
  const [claimRequestId] = await findClaimRequestId(
    namespaceId,
    entryName,
    new PublicKey(publicKey)
  );
  const tryClaimRequest = await tryGetClaimRequest(
    connection,
    NAMESPACE_NAME,
    entryName,
    new PublicKey(publicKey)
  );
  let transaction = new Transaction();
  if (!tryClaimRequest) {
    console.log("Creating claim request");
    await withCreateClaimRequest(
      connection,
      new SignerWallet(WALLET),
      NAMESPACE_NAME,
      entryName,
      new PublicKey(publicKey),
      transaction
    );
  }

  if (!tryClaimRequest || !tryClaimRequest?.parsed?.isApproved) {
    console.log("Approving claim request");
    await withUpdateClaimRequest(
      connection,
      new SignerWallet(WALLET),
      NAMESPACE_NAME,
      entryName,
      claimRequestId,
      true,
      transaction
    );
  }

  const checkNameEntry = await tryGetNameEntry(
    connection,
    NAMESPACE_NAME,
    entryName
  );
  if (!checkNameEntry) {
    ////////////////////// Init and claim //////////////////////
    console.log("---> Initializing and claiming entry:", entryName);
    const certificateMint = Keypair.generate();
    const transaction = new Transaction();
    const wallet = emptyWallet(new PublicKey(publicKey));
    await deprecated.withInitEntry(
      connection,
      wallet,
      certificateMint.publicKey,
      NAMESPACE_NAME,
      entryName,
      transaction
    );
    await deprecated.withClaimEntry(
      connection,
      wallet,
      NAMESPACE_NAME,
      entryName,
      certificateMint.publicKey,
      0,
      transaction
    );
    await deprecated.withSetReverseEntry(
      connection,
      wallet,
      NAMESPACE_NAME,
      entryName,
      certificateMint.publicKey,
      transaction
    );
  } else if (checkNameEntry && !checkNameEntry.parsed.isClaimed) {
    ////////////////////// Invalidated claim //////////////////////
    console.log("---> Claiming invalidated entry:", entryName);
    const wallet = emptyWallet(new PublicKey(publicKey));
    await deprecated.withClaimEntry(
      connection,
      wallet,
      NAMESPACE_NAME,
      entryName,
      checkNameEntry.parsed.mint,
      0,
      transaction
    );
    await deprecated.withSetReverseEntry(
      connection,
      wallet,
      NAMESPACE_NAME,
      entryName,
      checkNameEntry.parsed.mint,
      transaction
    );
  } else {
    const namespaceTokenAccount = await tryGetAta(
      connection,
      checkNameEntry.parsed.mint,
      namespaceId
    );

    if (
      namespaceTokenAccount?.amount &&
      namespaceTokenAccount?.amount.toNumber() > 0
    ) {
      ////////////////////// Expired claim //////////////////////
      console.log("---> Claiming expired entry:", entryName);
      const wallet = emptyWallet(new PublicKey(publicKey));
      await deprecated.withClaimEntry(
        connection,
        wallet,
        NAMESPACE_NAME,
        entryName,
        checkNameEntry.parsed.mint,
        0,
        transaction
      );
      await deprecated.withSetReverseEntry(
        connection,
        wallet,
        NAMESPACE_NAME,
        entryName,
        checkNameEntry.parsed.mint,
        transaction
      );
    } else {
      ////////////////////// Revoke and claim //////////////////////
      console.log("---> and claiming entry:", entryName);
      const wallet = emptyWallet(new PublicKey(publicKey));
      if (checkNameEntry.parsed.reverseEntry) {
        await withRevokeReverseEntry(
          transaction,
          connection,
          wallet as Wallet,
          NAMESPACE_NAME,
          entryName,
          checkNameEntry.parsed.reverseEntry,
          claimRequestId
        );
      }
      await deprecated.withRevokeEntry(
        connection,
        wallet,
        NAMESPACE_NAME,
        entryName,
        checkNameEntry.parsed.mint,
        checkNameEntry.parsed.data!,
        claimRequestId,
        transaction
      );
      await deprecated.withClaimEntry(
        connection,
        wallet,
        NAMESPACE_NAME,
        entryName,
        checkNameEntry.parsed.mint,
        0,
        transaction
      );
      await deprecated.withSetReverseEntry(
        connection,
        wallet,
        NAMESPACE_NAME,
        entryName,
        checkNameEntry.parsed.mint,
        transaction
      );
    }
  }

  transaction.feePayer = WALLET.publicKey;
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;
  transaction.partialSign(WALLET);
  transaction = Transaction.from(
    transaction.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
    })
  );

  // Serialize and return the unsigned transaction.
  const serialized = transaction.serialize({
    verifySignatures: false,
    requireAllSignatures: false,
  });
  const base64 = serialized.toString("base64");

  console.log(`Approving ${publicKey} for ${entryName}`);
  return {
    status: 200,
    transaction: base64,
    message: `Returned succesful transaciton for ${publicKey} to claim handle (${entryName})`,
  };
}
