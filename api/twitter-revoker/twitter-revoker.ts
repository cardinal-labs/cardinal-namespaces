import { getOwner } from "@cardinal/common";
import {
  deprecated,
  findClaimRequestId,
  findNamespaceId,
  shortenAddress,
  withRevokeReverseEntry,
} from "@cardinal/namespaces";
import * as anchor from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import * as web3 from "@solana/web3.js";

import { connectionFor, secondaryConnectionFor } from "../common/connection";
import { approveClaimRequestTransaction } from "../twitter-approver/api";
import {
  tryGetNameEntry,
  tweetContainsPublicKey,
} from "../twitter-claimer/utils";

// twtQEtj1wnNmSZZ475prwBFPbPit6w88YSfjia83g4k
const WALLET = web3.Keypair.fromSecretKey(
  anchor.utils.bytes.bs58.decode(process.env.TWITTER_SOLANA_KEY || "")
);

const NAMESPACE_NAME = "twitter";

export async function revokeHolder(
  tweetId: string,
  publicKey: string,
  entryName: string,
  cluster: web3.Cluster = "mainnet-beta"
): Promise<{ status: number; txid?: string; message?: string }> {
  console.log(
    `Attempting to revoke holder for tweet (${tweetId}) publicKey ${publicKey} entryName ${entryName} cluster ${cluster} `
  );

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
        message: String(e),
      };
    }
  }
  if (!tweetApproved) {
    return {
      status: 404,
      txid: "",
      message: `Public key ${shortenAddress(publicKey)} not found in tweet`,
    };
  }

  const connection = connectionFor(cluster);
  console.log(`Approving claim request for ${publicKey} for ${entryName}`);

  const transaction = await approveClaimRequestTransaction(
    connection,
    WALLET,
    NAMESPACE_NAME,
    entryName,
    new web3.PublicKey(publicKey)
  );

  console.log(`Revoking for ${publicKey} for ${entryName}`);

  const entry = await tryGetNameEntry(connection, NAMESPACE_NAME, entryName);
  if (!entry) throw new Error(`No entry for ${entryName} to be revoked`);

  const owner = await getOwner(
    secondaryConnectionFor(cluster),
    entry.parsed.mint.toString()
  );
  if (!owner) throw new Error(`No owner for ${entryName} to be revoked`);

  const [namespaceId] = await findNamespaceId(NAMESPACE_NAME);
  const [claimRequestId] = await findClaimRequestId(
    namespaceId,
    entryName,
    new web3.PublicKey(publicKey)
  );

  if (entry?.parsed.reverseEntry) {
    const reverseEntryId = entry?.parsed.reverseEntry;
    console.log(
      `Revoking reverse entry ${reverseEntryId.toString()} using claimId ${claimRequestId.toString()} from owner ${owner.toString()}`
    );
    const reverseEntry = await connection.getAccountInfo(reverseEntryId);
    if (reverseEntry) {
      await withRevokeReverseEntry(
        transaction,
        connection,
        new SignerWallet(WALLET),
        NAMESPACE_NAME,
        entryName,
        reverseEntryId,
        claimRequestId
      );
    }
  }

  console.log(
    `Revoking entry ${entryName} using claimId ${claimRequestId.toString()} from owner ${owner.toString()}`
  );

  if (owner.toString() !== namespaceId.toString()) {
    await deprecated.withRevokeEntry(
      connection,
      new SignerWallet(WALLET),
      NAMESPACE_NAME,
      entryName,
      entry?.parsed.mint,
      owner,
      claimRequestId,
      transaction
    );
  }

  let txid = "";
  if (transaction.instructions.length > 0) {
    console.log(
      `Executing transaction of length ${transaction.instructions.length}`
    );
    transaction.feePayer = WALLET.publicKey;
    transaction.recentBlockhash = (
      await connection.getRecentBlockhash("max")
    ).blockhash;
    txid = await web3.sendAndConfirmTransaction(connection, transaction, [
      WALLET,
    ]);
    console.log(
      `Succesfully revoke entries from ${owner.toString()}, txid (${txid})`
    );
  }

  console.log(
    `Succesfully revoked for publicKey (${publicKey}) for handle (${entryName}) txid (${txid})`
  );
  return {
    status: 200,
    txid,
    message: `Succesfully approved claim publicKey (${publicKey}) for handle (${entryName}) txid (${txid})`,
  };
}
