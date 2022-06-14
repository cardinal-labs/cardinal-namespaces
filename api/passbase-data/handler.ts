import { utils } from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import type { Handler } from "aws-lambda";
import fetch from "node-fetch";

import { connectionFor } from "../common/connection";

export type Request = {
  body: string;
  headers: { [key: string]: string };
  queryStringParameters: { [key: string]: string };
};

const WALLET = Keypair.fromSecretKey(
  utils.bytes.bs58.decode(process.env.TWITTER_SOLANA_KEY || "")
);

const handler: Handler = async (event: Request) => {
  const clusterParam = event?.queryStringParameters.cluster;
  const keypairParam = event?.queryStringParameters.keypair;
  const txid = event?.queryStringParameters.txid;
  const keypair = Keypair.fromSecretKey(utils.bytes.bs58.decode(keypairParam));
  const connection = connectionFor(clusterParam, "devnet");
  const transaction = await connection.getTransaction(txid);
  if (
    !transaction?.transaction.message.accountKeys
      .map((acc) => acc.toString())
      .includes(keypair.publicKey.toString())
  ) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Public key not found in transaction" }),
    };
  }
  await getIdentity("");
};

const getIdentity = async (
  uuid: string
): Promise<{ owner: { first_name: string } }> => {
  const apiUrl = `https://api.passbase.com/verification/v1/identities/${uuid}`;
  const headers = {
    "x-api-key": process.env.PASSBASE_SECRET_KEY!,
  };

  const response = (await fetch(apiUrl, { headers: headers })).json();
  return response as Promise<{ owner: { first_name: string } }>;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
module.exports.webhook = handler;
