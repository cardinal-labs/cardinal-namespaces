/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { shortenAddress } from "@cardinal/namespaces";
import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import fetch from "node-fetch";

import { connectionFor } from "../common/connection";
import * as api from "./api";

const TWITTER_API_KEYS = [
  "AAAAAAAAAAAAAAAAAAAAAC7iXgEAAAAAH%2BlE4oemN1y5aLOsCimsV32G9Cs%3DKgaXQRuggNA5UzuJmN1X9twXNARy7qxSiBxNf4oCc6CxKwIhxa",
  "AAAAAAAAAAAAAAAAAAAAAIeiYAEAAAAA0xfvS2Oonb3ijLTis8MmrSsRWm0%3DotAZj0h9Aq6qEa7VKLckzfeRH3eDxj2Gp69rxD4B7pJlf7kdQy",
  "AAAAAAAAAAAAAAAAAAAAAOz4ZgEAAAAAYQ%2F6yZsduzzRyIDsGuUlvbSM4nE%3DFzVAxwlczyaSn8tD2VqJN7AcgR97zcDXBLYZDrAwV8VLdrSKJM",
  "AAAAAAAAAAAAAAAAAAAAANcAbQEAAAAA6jd7gLquooPwcvc%2B%2F%2FNz62cp3Og%3DFNeW1ZQd6vunLwPZBS8mN65Sa7nn0mVc6sXTs7PhxXWt0VBOXA",
];

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
    tweetApproved = false;
    let tweetJson;
    let userHandle;
    for (let i = 0; i < TWITTER_API_KEYS.length; i++) {
      if (!tweetJson) {
        try {
          const tweetResponse = await fetch(
            `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=created_at&expansions=author_id`,
            {
              headers: {
                authorization: `Bearer ${TWITTER_API_KEYS[i]!}`,
              },
            }
          );
          tweetJson = await tweetResponse.json();
          userHandle = tweetJson.includes.users[0].username;
        } catch (e) {
          console.log("Invalid twitter API response", e);
          if (i === TWITTER_API_KEYS.length - 1) {
            return {
              status: 400,
              message: "Invalid twitter API response",
              txid: "",
            };
          }
        }
      }
    }
    if (userHandle !== entryName) {
      return {
        status: 401,
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        message: `Handle ${userHandle} does not match requested name ${entryName}`,
        txid: "",
      };
    }
    tweetApproved = tweetJson.data.text.includes(publicKey);
  }

  if (!tweetApproved) {
    return {
      status: 404,
      txid: "",
      message: `Public key ${shortenAddress(
        publicKey
      )} not found in tweet ${tweetId}`,
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
