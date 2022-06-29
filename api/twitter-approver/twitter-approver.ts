/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { shortenAddress } from "@cardinal/namespaces";
import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";

import { connectionFor } from "../common/connection";
import { tweetContainsPublicKey } from "../twitter-claimer/utils";
import * as api from "./api";

// twtQEtj1wnNmSZZ475prwBFPbPit6w88YSfjia83g4k
const WALLET = web3.Keypair.fromSecretKey(
  anchor.utils.bytes.bs58.decode(process.env.TWITTER_SOLANA_KEY || "")
);

const NAMESPACE_NAME = "twitter";

export async function approveTweet(
  tweetId: string,
  publicKey: string,
  entryName: string,
  cluster = "mainnet"
): Promise<{ status: number; txid?: string; message?: string }> {
  console.log(
    `Attempting to approve tweet for tweet (${tweetId}) publicKey ${publicKey} entryName ${entryName} cluster ${cluster} `
  );
  const connection = connectionFor(cluster);

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
        message: e,
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

  console.log(`Approving ${publicKey} for ${entryName}`);
  const txid = await api.approveClaimRequest(
    connection,
    WALLET,
    NAMESPACE_NAME,
    entryName,
    new web3.PublicKey(publicKey)
  );
  return {
    status: 200,
    txid,
    message: `Succesfully approved claim publicKey (${publicKey}) for handle (${entryName}) txid (${txid})`,
  };
}
