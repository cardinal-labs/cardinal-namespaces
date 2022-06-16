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
import { TYPEFORM_NAMESPACE } from "../typeform-data/typeform";

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

async function retryFn<T>(fn: () => {}, retries: number) {
  let counter = 0;
  let success = false;
  while (counter <= retries && !success) {
    try {
      await fn();
      success = true;
    } catch (e) {
      console.log(`Failed to send email, retry ${counter}/${retries}. ${e}`);
      counter = counter + 1;
    }
  }
}

const handler: Handler = async (event: Request) => {
  try {
    const data = JSON.parse(event.body);
    // Get data from POST request
    const responseId = data.form_response.token as string;
    const firstName = data.form_response.answers[0].text as string;
    const email = data.form_response.answers.filter(
      (answer) => answer.field.type === "email"
    )[0].email as string;
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
      txid = await sendAndConfirmTransaction(connection, transaction, [wallet]);
    }

    // Send Email to user to claim NFT
    const claimURL = `https://identity.cardinal.so/${TYPEFORM_NAMESPACE}/${responseId}?otp=${utils.bytes.bs58.encode(
      keypair.secretKey
    )}&cluster=${cluster}`;
    console.log(
      `Successfuly created Claim URL for ${firstName} with transaction ID ${txid}: ${claimURL}`
    );
    await retryFn(async () => await sendEmail(email, firstName, claimURL), 3);
    console.log(`Successfuly sent email to user: ${email}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Typeform webhook succeeded" }),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Typeform webhook failed: ${e}` }),
    };
  }
};
module.exports.webhook = handler;
