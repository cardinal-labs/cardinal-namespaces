import { findNamespaceId, getReverseEntry } from "@cardinal/namespaces";
import { utils } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import type { Handler } from "aws-lambda";
import nacl from "tweetnacl";

import { connectionFor } from "../common/connection";
import {
  getTypeformResponse,
  getTypeformResponseBase64EncodedFile,
  TYPEFORM_NAMESPACE,
} from "./typeform";

export type Request = {
  body: { [key: string]: SignedData | string };
  headers: { [key: string]: string };
  queryStringParameters?: { [key: string]: string };
};

export type SignedData = {
  config: string;
  event: string;
  pubkey: string;
  timestampSeconds: number;
};

const BLOCKTIME_THRESHOLD = 60 * 5;

export type TypeformResponse = {
  answers: {
    field: { id: string; ref: string; type: string };
    file_url?: string;
    text?: string;
    type: string;
  }[];
  token: string;
};

const handler: Handler = async (event: Request) => {
  const clusterParam = event?.queryStringParameters?.cluster;
  const connection = connectionFor(
    clusterParam || null,
    "mainnet-beta",
    "confirmed"
  );

  const keypairParam = event?.queryStringParameters?.keypair;
  if (!keypairParam) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "Missing keypair parameter" }),
    };
  }

  const data = event?.body?.data as SignedData;
  if (!data) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "Missing data parameter" }),
    };
  }

  const signedData = event?.body?.signedData as string;
  if (!signedData) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "Missing signedData parameter" }),
    };
  }

  const accountId = new PublicKey(event?.body?.account);
  if (!accountId) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "Missing signedData parameter" }),
    };
  }

  const keypair = Keypair.fromSecretKey(utils.bytes.bs58.decode(keypairParam));
  const signResult = nacl.sign.detached.verify(
    Buffer.from(JSON.stringify(data)),
    Buffer.from(signedData, "base64"),
    accountId.toBuffer()
  );
  if (!signResult) {
    return {
      statusCode: 403,
      headers: {
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({ message: "Transaction has expired" }),
    };
  }

  // check keypair
  if (data.pubkey !== keypair.publicKey.toString()) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Keypair key not found in transaction" }),
    };
  }

  //check blocktime
  if (Date.now() / 1000 - (data.timestampSeconds ?? 0) > BLOCKTIME_THRESHOLD) {
    return {
      statusCode: 403,
      headers: {
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({ message: "Transaction has expired" }),
    };
  }

  const [namespaceId] = await findNamespaceId(TYPEFORM_NAMESPACE);
  const nameEntryData = await getReverseEntry(
    connection,
    namespaceId,
    accountId
  );
  const typeformData = await getTypeformResponse(
    nameEntryData.parsed.entryName
  );

  if (!typeformData) {
    return {
      statusCode: 404,
      headers: {
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({ error: "Response not found " }),
    };
  }

  const imageAnswer = typeformData.answers[typeformData.answers.length - 1];
  const base64EncodedImage = await getTypeformResponseBase64EncodedFile(
    imageAnswer.file_url || ""
  );

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify({
      name: `${typeformData.answers[0].text || ""} ${
        typeformData.answers[1]?.text || ""
      }`,
      image: base64EncodedImage,
    }),
  };
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
module.exports.data = handler;
