/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, no-case-declarations */
import { utils } from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import type { Handler } from "aws-lambda";

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

const cluster = process.env.cluster || "devnet";

const handler: Handler = async (event: Request) => {
  try {
    const data = JSON.parse(event.body);
    console.log(data);

    // Get data from POST request
    const responseId = data.form_response.token as string;
    const firstName = data.form_response.answers[0].text as string;
    const email = data.form_response.answers.filter(
      (answer) => answer.field.type === "email"
    )[0].email as string;

    console.log(responseId, firstName, email);

    // Approve claim request in EmpireDAO Registration namespace
    const keypair = new Keypair();
    const connection = connectionFor(cluster);
    await approveClaimRequest(
      connection,
      wallet,
      "empiredao-registration",
      responseId,
      keypair.publicKey
    );

    // Send Email to user to claim NFT
    const claimURL = `https://cardinal-identity-kyc.vercel.app/empiredao-registration/${responseId}?otp=${utils.bytes.bs58.encode(
      keypair.secretKey
    )}&cluster=${cluster}`;
    console.log(claimURL);
    sendEmail(email, firstName, claimURL);
  } catch (e) {
    console.log(e);
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Verification reviewed" }),
  };
};
module.exports.webhook = handler;
