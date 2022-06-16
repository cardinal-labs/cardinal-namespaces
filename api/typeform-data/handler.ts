/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, no-case-declarations */
import { utils } from "@project-serum/anchor";
import type { Transaction } from "@solana/web3.js";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  SystemProgram,
} from "@solana/web3.js";
import type { Handler } from "aws-lambda";

import { connectionFor } from "../common/connection";
import { sendEmail } from "../common/sendEmail";
import { approveClaimRequestTransaction } from "../twitter-approver/api";
import { TYPEFORM_NAMESPACE } from "./typeform";

export type PassbaseEvent = { event: string; key: string; status: string };
export type Request = {
  body: string;
  headers: { [key: string]: string };
  queryStringParameters?: { [key: string]: string };
};

const wallet = Keypair.fromSecretKey(
  utils.bytes.bs58.decode(process.env.EMPIREDAO_SCAN_KEY || "")
);

const cluster = "mainnet-beta";
const slackSecret = process.env.SLACK_SECRET_KEY;

const handler: Handler = async (event: Request) => {
  try {
    // Get data from POST request
    if (
      event.queryStringParameters &&
      event.queryStringParameters.slackSecret &&
      event.queryStringParameters.slackSecret === slackSecret
    ) {
      const responseId = event.queryStringParameters.responseId;
      const firstName = event.queryStringParameters.firstName;
      const email = event.queryStringParameters.email;

      console.log(
        `Received typeform webook response (${responseId}), name (${firstName}), email (${email})`
      );

      // Approve claim request in EmpireDAO Registration namespace
      const keypair = new Keypair();
      const connection = connectionFor(cluster);
      const transaction: Transaction = await approveClaimRequestTransaction(
        connection,
        wallet,
        TYPEFORM_NAMESPACE,
        responseId,
        keypair.publicKey
      );
      let txid = "";
      if (transaction.instructions.length > 0) {
        console.log(
          `Executing transaction of length ${transaction.instructions.length}`
        );
        transaction.instructions = [
          ...transaction.instructions,
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: keypair.publicKey,
            lamports: 0.001 * LAMPORTS_PER_SOL,
          }),
        ];
        transaction.feePayer = wallet.publicKey;
        transaction.recentBlockhash = (
          await connection.getRecentBlockhash("max")
        ).blockhash;
        txid = await sendAndConfirmTransaction(connection, transaction, [
          wallet,
        ]);
      }

      // Send Email to user to claim NFT
      const claimURL = `https://identity.cardinal.so/${TYPEFORM_NAMESPACE}/${responseId}?otp=${utils.bytes.bs58.encode(
        keypair.secretKey
      )}&cluster=${cluster}`;
      console.log(
        `Successfuly created Claim URL for ${firstName} with transaction ID ${txid}: ${claimURL}`
      );
      await sendEmail(email, firstName, claimURL);
      console.log(`Successfuly sent email to user: ${email}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Applicant Approval succeeded" }),
        headers: {
          "Access-Control-Allow-Methods": "*",
          "Access-Control-Allow-Origin": "*", // Required for CORS support to work
          "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
        },
      };
    }
  } catch (e) {
    console.log(e);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Applicant Approval failed: ${e}` }),
      headers: {
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
    };
  }
};
module.exports.approve = handler;
