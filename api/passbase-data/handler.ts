import { findNamespaceId, getReverseEntry } from "@cardinal/namespaces";
import { utils } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import type { Handler } from "aws-lambda";
import fetch from "node-fetch";

import { connectionFor } from "../common/connection";

const PASSBASE_NAMESPACE = "passbase";

export type Request = {
  body: string;
  headers: { [key: string]: string };
  queryStringParameters?: { [key: string]: string };
};

export type PassbaseResource = {
  id: string;
  type:
    | "SELFIE_VIDEO"
    | "DRIVERS_LICENSE"
    | "NATIONAL_ID_CARD"
    | "PASSPORT"
    | "PROOF_OF_ADDRESS"
    | "COVID_VACCINATION_CARD"
    | "HEALTH_INSURANCE_CARD"
    | "HEALTH_INSURANCE_CARD_US";
  resource_files: { id: string }[];
};

export type PassbaseIdentity = {
  owner: {
    first_name: string;
    last_name: string;
    email: string;
  };
  resources: PassbaseResource[];
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

  // check blocktime
  if (Date.now() / 1000 - (transaction.blockTime ?? 0) > BLOCKTIME_THRESHOLD) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "Transaction has expired" }),
    };
  }

  // TODO get Passbase ID from on-chain
  const [namespaceId] = await findNamespaceId(PASSBASE_NAMESPACE);
  const nameEntryData = await getReverseEntry(
    connection,
    namespaceId,
    new PublicKey(address)
  );
  const identityId = uuidFromString(nameEntryData.parsed.entryName);
  const identity = await getIdentity(identityId);

  const resource =
    identity.resources.find((resource) => resource.type === "SELFIE_VIDEO") ||
    identity.resources.find((resource) => resource.type === "DRIVERS_LICENSE");

  const resourceFile = resource?.resource_files
    ? resource.resource_files[0]
    : undefined;
  const resourceFileData = await getResourceFile(
    identityId,
    resource?.id,
    resourceFile?.id
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      first_name: identity.owner.first_name,
      last_name: identity.owner.last_name,
      resourceData: resourceFileData,
    }),
  };
};

const uuidFromString = (uuidString: string) =>
  `${uuidString.substr(0, 8)}-${uuidString.substr(8, 4)}-${uuidString.substr(
    12,
    4
  )}-${uuidString.substr(16, 4)}-${uuidString.substr(20)}`;

const getIdentity = async (uuid: string): Promise<PassbaseIdentity> => {
  const apiUrl = `https://api.passbase.com/verification/v1/identities/${uuid}`;
  const headers = {
    "x-api-key": process.env.PASSBASE_SECRET_KEY || "",
  };

  const response = (await fetch(apiUrl, { headers: headers })).json();
  return response as Promise<PassbaseIdentity>;
};

const getResourceFile = async (
  identityId: string,
  resourceId: string | undefined,
  resourceFileId: string | undefined
): Promise<{ id: string } | undefined> => {
  if (!resourceId || !resourceFileId) return;
  try {
    const response = await fetch(
      `https://api.passbase.com/verification/v1/identity/${identityId}/resources/${resourceId}/resource_files/${resourceFileId}`,
      {
        headers: {
          "x-api-key": process.env.PASSBASE_SECRET_KEY || "",
        },
      }
    );
    const json = (await response.json()) as { id: string };
    return json;
  } catch (e) {
    console.log("Failed to access files");
  }
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
module.exports.data = handler;
