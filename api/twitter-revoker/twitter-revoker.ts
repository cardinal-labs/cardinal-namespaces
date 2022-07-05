/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getOwner } from "@cardinal/common";
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
import { SignerWallet } from "@saberhq/solana-contrib";
import * as web3 from "@solana/web3.js";
import fetch from "node-fetch";

import { connectionFor, secondaryConnectionFor } from "../common/connection";
import type { DiscordUserInfoParams } from "../tools/types";
import {
  tryGetNameEntry,
  tweetContainsPublicKey,
} from "../twitter-claimer/utils";
import { tryGetClaimRequest } from "./api";

export async function revokeHolder(
  namespace: string,
  publicKey: string,
  entryName: string,
  tweetId?: string,
  accessToken?: string,
  cluster: web3.Cluster = "mainnet-beta"
): Promise<{ status: number; txid?: string; message?: string }> {
  let wallet: web3.Keypair | undefined;
  try {
    wallet = web3.Keypair.fromSecretKey(
      anchor.utils.bytes.bs58.decode(
        namespace === "twitter"
          ? process.env.TWITTER_SOLANA_KEY || ""
          : namespace === "discord"
          ? process.env.DISCORD_SOLANA_KEY || ""
          : ""
      )
    );
  } catch {
    throw new Error(
      `${namespace} pk incorrect or not found ${
        process.env.DISCORD_SOLANA_KEY || ""
      }`
    );
  }
  let approved = true;

  if (namespace === "twitter") {
    console.log(
      `Attempting to revoke holder for tweet (${tweetId!}) publicKey ${publicKey} entryName ${entryName} cluster ${cluster} `
    );
    if (cluster !== "devnet") {
      try {
        approved = await tweetContainsPublicKey(tweetId!, entryName, publicKey);
      } catch (e) {
        console.log("Failed twitter check: ", e);
        return {
          status: 401,
          message: String(e),
        };
      }
    }
  } else if (namespace === "discord") {
    // get user information
    const userResponse = await fetch("http://discordapp.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken!}`,
      },
    });
    const userJson = await userResponse.json();
    let parsedUserResponse: DiscordUserInfoParams | undefined;
    try {
      parsedUserResponse = userJson as DiscordUserInfoParams;
    } catch (e) {
      return {
        status: 500,
        message: "Error parsing server response",
      };
    }
    approved = parsedUserResponse.username === entryName;
  } else {
    ("pass");
  }

  if (!approved) {
    return {
      status: 404,
      txid: "",
      message: `Public key ${shortenAddress(publicKey)} not found in tweet`,
    };
  }

  const connection = connectionFor(cluster);
  console.log(`Approving claim request for ${publicKey} for ${entryName}`);

  const [nameEntry, claimRequest] = await Promise.all([
    tryGetNameEntry(connection, namespace, entryName),
    tryGetClaimRequest(
      connection,
      namespace,
      entryName,
      new web3.PublicKey(publicKey)
    ),
  ]);
  if (!nameEntry) throw new Error(`No entry for ${entryName} to be revoked`);

  const [namespaceId] = await findNamespaceId(namespace);
  const [claimRequestId] = await findClaimRequestId(
    namespaceId,
    entryName,
    new web3.PublicKey(publicKey)
  );

  const transaction = new web3.Transaction();
  if (!claimRequest) {
    console.log("Creating claim request");
    await withCreateClaimRequest(
      connection,
      new SignerWallet(wallet),
      namespace,
      entryName,
      new web3.PublicKey(publicKey),
      transaction
    );
  }

  if (
    !claimRequest ||
    !claimRequest?.parsed?.isApproved ||
    claimRequest.parsed.counter !== nameEntry.parsed.claimRequestCounter
  ) {
    console.log("Approving claim request");
    const [claimRequestId] = await findClaimRequestId(
      namespaceId,
      entryName,
      new web3.PublicKey(publicKey)
    );

    await withUpdateClaimRequest(
      connection,
      new SignerWallet(wallet),
      namespace,
      entryName,
      claimRequestId,
      true,
      transaction
    );
  }

  console.log(`Revoking for ${publicKey} for ${entryName}`);

  const owner = await getOwner(
    secondaryConnectionFor(cluster),
    nameEntry.parsed.mint.toString()
  );
  if (!owner) throw new Error(`No owner for ${entryName} to be revoked`);

  if (nameEntry.parsed.reverseEntry) {
    const reverseEntryId = nameEntry.parsed.reverseEntry;
    console.log(
      `Revoking reverse entry ${reverseEntryId.toString()} using claimId ${claimRequestId.toString()} from owner ${owner.toString()}`
    );
    const reverseEntry = await connection.getAccountInfo(reverseEntryId);
    if (reverseEntry) {
      await withRevokeReverseEntry(
        transaction,
        connection,
        new SignerWallet(wallet),
        namespace,
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
      new SignerWallet(wallet),
      namespace,
      entryName,
      nameEntry.parsed.mint,
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
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (
      await connection.getRecentBlockhash("max")
    ).blockhash;
    txid = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet],
      { skipPreflight: true }
    );
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
