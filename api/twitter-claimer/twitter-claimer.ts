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
import { SignerWallet } from "@saberhq/solana-contrib";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import fetch from "node-fetch";

import { connectionFor } from "../common/connection";
import {
  tryGetAta,
  tryGetClaimRequest,
  tryGetNameEntry,
  tweetContainsPublicKey,
} from "./utils";

type UserInfoParams = {
  id: string;
  username: string;
  avatar: string;
};

export async function claimTransaction(
  namespace: string,
  publicKey: string,
  entryName: string,
  tweetId?: string,
  accessToken?: string,
  cluster = "mainnet"
): Promise<{ status: number; transaction?: string; message?: string }> {
  const connection = connectionFor(cluster);
  let wallet: Keypair | undefined;
  try {
    wallet = Keypair.fromSecretKey(
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

  if (namespace === "twitter") {
    console.log(
      `Attempting to approve tweet for tweet (${tweetId!}) publicKey ${publicKey} entryName ${entryName} cluster ${cluster} `
    );

    // check tweet
    let tweetApproved = true;
    if (cluster !== "devnet") {
      try {
        tweetApproved = await tweetContainsPublicKey(
          tweetId!,
          entryName,
          publicKey
        );
        console.log(tweetApproved);
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
        )} not found in tweet ${tweetId!}`,
      };
    }
  } else if (namespace === "discord") {
    console.log(
      `Attempting to approve discord handle publicKey ${publicKey} entryName ${entryName} cluster ${cluster} `
    );
    const userResponse = await fetch("http://discordapp.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken!}`,
      },
    });

    const userJson = await userResponse.json();
    let parsedUserResponse: UserInfoParams | undefined;
    try {
      parsedUserResponse = userJson as UserInfoParams;
      if (encodeURIComponent(parsedUserResponse.username) === entryName) {
        return {
          status: 401,
          message: "Could not verify entry name",
        };
      }
    } catch (e) {
      return {
        status: 401,
        message: "Error parsing server response",
      };
    }
  } else {
    return {
      status: 400,
      message: "Invalid identity namespace",
    };
  }

  const [namespaceId] = await findNamespaceId(namespace);
  const [claimRequestId] = await findClaimRequestId(
    namespaceId,
    entryName,
    new PublicKey(publicKey)
  );
  const tryClaimRequest = await tryGetClaimRequest(
    connection,
    namespace,
    entryName,
    new PublicKey(publicKey)
  );
  let transaction = new Transaction();
  let mintKeypair: Keypair | undefined;
  if (!tryClaimRequest) {
    console.log("Creating claim request");
    await withCreateClaimRequest(
      connection,
      new SignerWallet(wallet),
      namespace,
      entryName,
      new PublicKey(publicKey),
      transaction
    );
  }

  if (!tryClaimRequest || !tryClaimRequest?.parsed?.isApproved) {
    console.log("Approving claim request");
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

  const checkNameEntry = await tryGetNameEntry(
    connection,
    namespace,
    entryName
  );
  if (!checkNameEntry) {
    ////////////////////// Init and claim //////////////////////
    console.log("---> Initializing and claiming entry:", entryName);
    mintKeypair = Keypair.generate();
    const wallet = emptyWallet(new PublicKey(publicKey));
    await deprecated.withInitEntry(
      connection,
      wallet,
      mintKeypair.publicKey,
      namespace,
      entryName,
      transaction
    );
    await deprecated.withClaimEntry(
      connection,
      wallet,
      namespace,
      entryName,
      mintKeypair.publicKey,
      0,
      transaction
    );
    await deprecated.withSetReverseEntry(
      connection,
      wallet,
      namespace,
      entryName,
      mintKeypair.publicKey,
      transaction
    );
  } else if (checkNameEntry && !checkNameEntry.parsed.isClaimed) {
    ////////////////////// Invalidated claim //////////////////////
    console.log("---> Claiming invalidated entry:", entryName);
    const wallet = emptyWallet(new PublicKey(publicKey));
    await deprecated.withClaimEntry(
      connection,
      wallet,
      namespace,
      entryName,
      checkNameEntry.parsed.mint,
      0,
      transaction
    );
    await deprecated.withSetReverseEntry(
      connection,
      wallet,
      namespace,
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
        namespace,
        entryName,
        checkNameEntry.parsed.mint,
        0,
        transaction
      );
      await deprecated.withSetReverseEntry(
        connection,
        wallet,
        namespace,
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
          wallet,
          namespace,
          entryName,
          checkNameEntry.parsed.reverseEntry,
          claimRequestId
        );
      }
      await deprecated.withRevokeEntry(
        connection,
        wallet,
        namespace,
        entryName,
        checkNameEntry.parsed.mint,
        checkNameEntry.parsed.data!,
        claimRequestId,
        transaction
      );
      await deprecated.withClaimEntry(
        connection,
        wallet,
        namespace,
        entryName,
        checkNameEntry.parsed.mint,
        0,
        transaction
      );
      await deprecated.withSetReverseEntry(
        connection,
        wallet,
        namespace,
        entryName,
        checkNameEntry.parsed.mint,
        transaction
      );
    }
  }

  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;
  transaction.partialSign(wallet);
  mintKeypair && transaction.partialSign(mintKeypair);
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
    message: `Returned succesfull transaction for ${publicKey} to claim handle (${entryName})`,
  };
}
