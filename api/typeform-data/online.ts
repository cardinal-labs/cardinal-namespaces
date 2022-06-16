import { findNamespaceId, getReverseEntry } from "@cardinal/namespaces";
import { utils } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import type { Handler } from "aws-lambda";

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

const BLOCKTIME_THRESHOLD = 60 * 5;

const handler: Handler = async (event: Request) => {
  const clusterParam = event?.queryStringParameters?.cluster;
  const keypairParam = event?.queryStringParameters?.keypair;
  if (!keypairParam) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "Missing keypair parameter" }),
    };
  }
  const txid = event?.queryStringParameters?.txid;
  if (!txid) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "Missing transaction parameter" }),
    };
  }
  const keypair = Keypair.fromSecretKey(utils.bytes.bs58.decode(keypairParam));
  const connection = connectionFor(
    clusterParam || null,
    "mainnet-beta",
    "confirmed"
  );
  const transaction = await connection.getTransaction(txid);

  // check keypair
  if (
    !transaction?.transaction.message.accountKeys
      .map((acc) => acc.toString())
      .includes(keypair.publicKey.toString())
  ) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Keypair key not found in transaction" }),
    };
  }

  // check address
  const address = transaction?.transaction.message.accountKeys
    .map((acc) => acc.toString())
    .filter((_, i) => transaction.transaction.message.isAccountSigner(i))[0];
  // if (
  //   !transaction?.transaction.message.accountKeys
  //     .map((acc) => acc.toString())
  //     .filter((_, i) => transaction.transaction.message.isAccountSigner(i))
  //     .includes(address)
  // ) {
  //   return {
  //     statusCode: 404,
  //     body: JSON.stringify({ message: "Address key not found in transaction" }),
  //   };
  // }

  //check blocktime
  if (Date.now() / 1000 - (transaction.blockTime ?? 0) > BLOCKTIME_THRESHOLD) {
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
    new PublicKey(address)
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
