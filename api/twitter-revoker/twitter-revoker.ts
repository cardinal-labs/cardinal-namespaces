import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";

import { connectionFor } from "../common/connection";
import * as api from "./api";

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
): Promise<string> {
  console.log(
    `Attempting to revoke holder for tweet (${tweetId}) publicKey ${publicKey} entryName ${entryName} cluster ${cluster} `
  );
  const connection = connectionFor(cluster);

  let txid: string;
  const checkClaimRequest = await api.tryGetClaimRequest(
    connection,
    NAMESPACE_NAME,
    entryName,
    new web3.PublicKey(publicKey)
  );

  if (checkClaimRequest && checkClaimRequest.parsed.isApproved) {
    console.log(`Revoking for ${publicKey} for ${entryName}`);
    txid = await api.revoke(
      cluster,
      connection,
      WALLET,
      NAMESPACE_NAME,
      entryName,
      checkClaimRequest.pubkey
    );
  } else {
    throw new Error("User cannot revoke since they have not been approved");
  }
  console.log(
    `Succesfully revoked for publicKey (${publicKey}) for handle (${entryName}) txid (${txid})`
  );
  return txid;
}
