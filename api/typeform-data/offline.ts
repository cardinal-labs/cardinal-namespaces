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
  body: string;
  headers: { [key: string]: string };
  queryStringParameters?: { [key: string]: string };
};

export type RequestBody = {
  account: string;
  data: SignedData;
  signedData: string;
};

export type SignedData = {
  config: string;
  event: string;
  pubkey: string;
  timestampSeconds: string;
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
      headers: {
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({ message: "Missing keypair parameter" }),
    };
  }

  const body = JSON.parse(event.body) as RequestBody;
  const data = body.data;
  if (!data) {
    return {
      statusCode: 403,
      headers: {
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({ message: "Missing data parameter" }),
    };
  }

  const signedData = body.signedData;
  if (!signedData) {
    return {
      statusCode: 403,
      headers: {
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({ message: "Missing signedData parameter" }),
    };
  }

  const accountId = new PublicKey(body.account);
  if (!accountId) {
    return {
      statusCode: 403,
      headers: {
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({ message: "Missing signedData parameter" }),
    };
  }

  const keypair = Keypair.fromSecretKey(utils.bytes.bs58.decode(keypairParam));
  const signResult = nacl.sign.detached.verify(
    Buffer.from(JSON.stringify(data, Object.keys(data).sort())),
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
      body: JSON.stringify({ message: "Sign message is invalid" }),
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
  if (
    Date.now() / 1000 - (parseInt(data.timestampSeconds) ?? 0) >
    BLOCKTIME_THRESHOLD
  ) {
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
      body: JSON.stringify({ error: "Response not found" }),
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
