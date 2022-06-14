import { findNamespaceId, getReverseEntry } from "@cardinal/namespaces";
import { utils } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import type { Handler } from "aws-lambda";
import fetch from "node-fetch";

import { connectionFor } from "../common/connection";

export type Request = {
  body: string;
  headers: { [key: string]: string };
  queryStringParameters?: { [key: string]: string };
};

export const TYPEFORM_NAMESPACE = "EmpireDAO";
const BLOCKTIME_THRESHOLD = 60 * 5;
const TYPEFORM_FORM_ID = process.env.TYPEFORM_ID || "";
const TYPEFORM_API_KEY = process.env.TYPEFORM_API_KEY || "";

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
  const test = event?.queryStringParameters?.test;
  if (test) {
    const typeformData = await getTypeformResponse(
      "t009laq8qewah1t009ned5nrq5icl5o0"
    );
    const imageAnswer = typeformData!.answers[typeformData!.answers.length - 1];
    const base64EncodedImage = await getTypeformResponseBase64EncodedFile(
      imageAnswer.file_url || ""
    );
    return {
      statusCode: 200,
      body: JSON.stringify({
        name: `${typeformData!.answers[0].text || ""} ${
          typeformData!.answers[1]?.text || ""
        }`,
        image: base64EncodedImage,
      }),
    };
  }

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
  const connection = connectionFor(clusterParam || null, "devnet", "confirmed");
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
      body: JSON.stringify({ error: "Response not found " }),
    };
  }

  const imageAnswer = typeformData.answers[typeformData.answers.length - 1];
  const base64EncodedImage = await getTypeformResponseBase64EncodedFile(
    imageAnswer.file_url || ""
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      name: `${typeformData.answers[0].text || ""} ${
        typeformData.answers[1]?.text || ""
      }`,
      image: base64EncodedImage,
    }),
  };
};

const getTypeformResponse = async (
  entryName: string,
  formId = TYPEFORM_FORM_ID
): Promise<TypeformResponse | undefined> => {
  const response = await fetch(
    `https://api.typeform.com/forms/${formId}/responses`,
    {
      headers: {
        Authorization: `bearer ${TYPEFORM_API_KEY}`,
      },
    }
  );
  const typeformResponse = (await response.json()) as {
    items: TypeformResponse[];
  };
  return typeformResponse.items.find((r) => r.token === entryName);
};

const getTypeformResponseBase64EncodedFile = async (
  fileUrl: string
): Promise<string> => {
  const response = await fetch(fileUrl, {
    headers: {
      Authorization: `bearer ${TYPEFORM_API_KEY}`,
    },
  });
  const buffer = await response.buffer();
  return buffer.toString("base64");
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
module.exports.data = handler;
