/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { emptyWallet } from "@cardinal/common";
import {
  deprecated,
  findClaimRequestId,
  findNamespaceId,
  shortenAddress,
  withApproveClaimRequest,
  withClaimNameEntry,
  withInitNameEntry,
  withRevokeNameEntry,
  withRevokeReverseEntry,
  withSetNamespaceReverseEntry,
} from "@cardinal/namespaces";
import * as anchor from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  // sendAndConfirmRawTransaction,
  Transaction,
} from "@solana/web3.js";
import fetch from "node-fetch";

import { connectionFor } from "../common/connection";
import {
  tryGetAta,
  tryGetNameEntry,
  tweetContainsPublicKey,
} from "../twitter-claimer/utils";

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
  let approverAuthority: Keypair | undefined;
  try {
    approverAuthority = Keypair.fromSecretKey(
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

  const userWallet = emptyWallet(new PublicKey(publicKey));
  const [namespaceId] = await findNamespaceId(namespace);
  const [claimRequestId] = await findClaimRequestId(
    namespaceId,
    entryName,
    userWallet.publicKey
  );
  const checkNameEntry = await tryGetNameEntry(
    connection,
    namespace,
    entryName
  );

  let tx = new Transaction();
  let mintKeypair: Keypair | undefined;

  console.log("Approve claim request");
  await withApproveClaimRequest(tx, connection, userWallet, {
    namespaceName: namespace,
    entryName: entryName,
    user: userWallet.publicKey,
    approveAuthority: approverAuthority.publicKey,
  });

  if (!checkNameEntry) {
    ////////////////////// Init and claim //////////////////////
    console.log("---> Initializing and claiming entry:", entryName);
    mintKeypair = Keypair.generate();
    await withInitNameEntry(tx, connection, userWallet, namespace, entryName);
    await withClaimNameEntry(
      tx,
      connection,
      userWallet,
      namespace,
      entryName,
      mintKeypair.publicKey,
      0
    );
    // set namespace reverse entry
    await withSetNamespaceReverseEntry(
      tx,
      connection,
      userWallet,
      namespace,
      entryName,
      mintKeypair.publicKey,
      userWallet.publicKey
    );
    // set global reverse entry
    await deprecated.withSetReverseEntry(
      connection,
      userWallet,
      namespace,
      entryName,
      mintKeypair.publicKey,
      tx
    );
  } else if (checkNameEntry && !checkNameEntry.parsed.isClaimed) {
    ////////////////////// Invalidated claim //////////////////////
    console.log("---> Claiming invalidated entry:", entryName);
    await withClaimNameEntry(
      tx,
      connection,
      userWallet,
      namespace,
      entryName,
      checkNameEntry.parsed.mint,
      0
    );
    // set namespace reverse entry
    await withSetNamespaceReverseEntry(
      tx,
      connection,
      userWallet,
      namespace,
      entryName,
      checkNameEntry.parsed.mint,
      userWallet.publicKey
    );
    // set global reverse entry
    await deprecated.withSetReverseEntry(
      connection,
      userWallet,
      namespace,
      entryName,
      checkNameEntry.parsed.mint,
      tx
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
      await withClaimNameEntry(
        tx,
        connection,
        userWallet,
        namespace,
        entryName,
        checkNameEntry.parsed.mint,
        0
      );
      // set namespace reverse entry
      await withSetNamespaceReverseEntry(
        tx,
        connection,
        userWallet,
        namespace,
        entryName,
        checkNameEntry.parsed.mint,
        userWallet.publicKey
      );
      // set global reverse entry
      await deprecated.withSetReverseEntry(
        connection,
        userWallet,
        namespace,
        entryName,
        checkNameEntry.parsed.mint,
        tx
      );
    } else {
      ////////////////////// Revoke and claim //////////////////////
      console.log("---> and claiming entry:", entryName);
      if (checkNameEntry.parsed.reverseEntry) {
        await withRevokeReverseEntry(
          tx,
          connection,
          userWallet,
          namespace,
          entryName,
          checkNameEntry.parsed.reverseEntry,
          claimRequestId
        );
      }
      await withRevokeNameEntry(
        tx,
        connection,
        userWallet,
        namespace,
        entryName,
        checkNameEntry.parsed.mint,
        claimRequestId
      );
      await withClaimNameEntry(
        tx,
        connection,
        userWallet,
        namespace,
        entryName,
        checkNameEntry.parsed.mint,
        0
      );
      // set namespace reverse entry
      await withSetNamespaceReverseEntry(
        tx,
        connection,
        userWallet,
        namespace,
        entryName,
        checkNameEntry.parsed.mint,
        userWallet.publicKey
      );
      // set global reverse entry
      await deprecated.withSetReverseEntry(
        connection,
        userWallet,
        namespace,
        entryName,
        checkNameEntry.parsed.mint,
        tx
      );
    }
  }

  tx.feePayer = userWallet.publicKey;
  tx.recentBlockhash = (await connection.getRecentBlockhash("max")).blockhash;
  tx.partialSign(approverAuthority);
  // mintKeypair && tx.partialSign(mintKeypair);
  tx = Transaction.from(
    tx.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
    })
  );

  // Serialize and return the unsigned transaction.
  const serialized = tx.serialize({
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
