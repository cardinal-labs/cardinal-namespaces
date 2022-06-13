import fetch from "node-fetch";
import crypto from "crypto";
import { Handler } from "aws-lambda";
import { approveClaimRequest } from "../twitter-approver/api";
import { Keypair } from "@solana/web3.js";
import { connectionFor } from "../common/connection";
import { utils } from "@project-serum/anchor";

const handler: Handler = async (event) => {
  const webhook = decryptWebhookIfNeeded(event);
  console.log(webhook);
  switch (webhook.event) {
    case "VERIFICATION_COMPLETED":
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Verification complete" }),
      };
      break;
    case "VERIFICATION_REVIEWED":
      const uuid = webhook.key;
      const userData = await getIdentity(uuid);
      const uuidNoDash = uuid.replace(/-/g, "");
      console.log(webhook.status, userData.owner);
      if (webhook.status === "approved") {
        // approve claim request in passbase namespace

        const keypair = new Keypair();
        const connection = connectionFor("devnet");
        console.log(uuidNoDash);
        const txid = await approveClaimRequest(
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
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Verification reviewed" }),
      };
      break;
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Invalid passbase event" }),
      };
  }
};

const getIdentity = async (uuid: string) => {
  const apiUrl = `https://api.passbase.com/verification/v1/identities/${uuid}`;
  const headers = {
    "x-api-key": process.env.PASSBASE_SECRET_KEY!,
  };

  const response = (await fetch(apiUrl, { headers: headers })).json();
  return response;
};

const decryptWebhook = (body) => {
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
  return result;
};

const decryptWebhookIfNeeded = (request) => {
  if (request.headers["Content-Type"] === "text/plain") {
    return decryptWebhook(request.body);
  } else {
    return JSON.parse(request.body);
  }
};

module.exports.webhook = handler;
