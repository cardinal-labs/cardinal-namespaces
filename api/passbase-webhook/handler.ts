/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, no-case-declarations */
import { utils } from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import type { Handler } from "aws-lambda";
import crypto from "crypto";
import fetch from "node-fetch";

import { connectionFor } from "../common/connection";
import { approveClaimRequest } from "../twitter-approver/api";
import { sendEmail } from "./sendEmail";

export type PassbaseEvent = { event: string; key: string; status: string };
export type Request = {
  body: string;
  headers: { [key: string]: string };
  queryStringParameters?: { [key: string]: string };
};

// kycLcoGB9Lf1j1mLxbaYcR3HUgBywHBxmLJPcvFr5BP
const wallet = Keypair.fromSecretKey(
  utils.bytes.bs58.decode(
    process.env.KYC_SECRET_KEY ||
      "2SogHyWWyJxRpNjgjhRGRAWfsNaYYDjYx3Z9FyJLi926N6nC3tWMjEVtzMdKmDJiDvpoeRu3Sjin6g1cLBxib8Ed"
  )
);

const handler: Handler = async (event: Request) => {
  console.log("handler");
  const clusterParam = event?.queryStringParameters?.cluster || null;
  console.log(event);
  const webhook = decryptWebhookIfNeeded(event);
  switch (webhook.event) {
    case "VERIFICATION_COMPLETED":
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Verification complete" }),
      };
      break;
    case "VERIFICATION_REVIEWED":
      console.log(webhook);
      const uuid = webhook.key;
      const userData = await getIdentity(uuid);
      const uuidNoDash = uuid.replace(/-/g, "");
      if (webhook.status === "approved") {
        // approve claim request in passbase namespace

        const keypair = new Keypair();
        const connection = connectionFor(clusterParam, "devnet");
        await approveClaimRequest(
          connection,
          wallet,
          "passbase",
          uuidNoDash,
          keypair.publicKey
        );
        console.log(
          `Secret key for claim: ${utils.bytes.bs58.encode(keypair.secretKey)}`
        );
        console.log(
          `Successfuly approved ${userData.owner.first_name} for claiming their Registration NFT`
        );

        // send email to user with private key of keypair
        sendEmail(userData.owner.email, userData.owner.first_name);
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Verification reviewed" }),
      };
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Invalid passbase event" }),
      };
  }
};

const getIdentity = async (
  uuid: string
): Promise<{ owner: { first_name: string; email: string } }> => {
  const apiUrl = `https://api.passbase.com/verification/v1/identities/${uuid}`;
  const headers = {
    "x-api-key": process.env.PASSBASE_SECRET_KEY!,
  };

  const response = (await fetch(apiUrl, { headers: headers })).json();
  return response as Promise<{ owner: { first_name: string; email: string } }>;
};

const decryptWebhook = (body: string): PassbaseEvent => {
  const encryptedResult = Buffer.from(body, "base64");
  const iv = encryptedResult.slice(0, 16);
  const cipher = crypto.createDecipheriv(
    "aes-256-cbc",
    process.env.PASSBASE_WEBHOOK_SECRET!,
    iv
  );
  const decryptedResultBytes = Buffer.concat([
    cipher.update(encryptedResult.slice(16)),
    cipher.final(),
  ]);
  const decryptedResult = decryptedResultBytes.toString();
  const result = JSON.parse(decryptedResult);
  return result as PassbaseEvent;
};

const decryptWebhookIfNeeded = (request: Request): PassbaseEvent => {
  if (request.headers["Content-Type"] === "text/plain") {
    return decryptWebhook(request.body);
  } else {
    return JSON.parse(request.body) as {
      event: string;
      key: string;
      status: string;
    };
  }
};

module.exports.webhook = handler;
