/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { tryPublicKey } from "@cardinal/common";

import * as twitterClaimer from "./twitter-claimer";

module.exports.claim = async (event) => {
  const data = JSON.parse(event.body);
  const account = data.account as string;
  try {
    if (
      !event?.queryStringParameters?.tweetId ||
      event?.queryStringParameters?.tweetId === "undefined" ||
      !account ||
      !tryPublicKey(account) ||
      !event?.queryStringParameters?.handle ||
      event?.queryStringParameters?.handle === "undefined"
    ) {
      return {
        statusCode: 412,
        body: JSON.stringify({ error: "Invalid API request" }),
      };
    }

    const { status, transaction, message } =
      await twitterClaimer.claimTransaction(
        event?.queryStringParameters?.tweetId,
        account,
        event?.queryStringParameters?.handle,
        event?.queryStringParameters?.cluster
      );
    return {
      statusCode: status,
      headers: {
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({ result: "done", transaction, message }),
    };
  } catch (e) {
    console.log("Error approving claim request: ", e);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({ error: String(e) }),
    };
  }
};
