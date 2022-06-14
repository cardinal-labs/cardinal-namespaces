/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

import * as twitterApprover from "./twitter-approver";

module.exports.approve = async (event) => {
  try {
    if (
      !event?.queryStringParameters?.tweetId ||
      event?.queryStringParameters?.tweetId === "undefined" ||
      !event?.queryStringParameters?.publicKey ||
      event?.queryStringParameters?.publicKey === "undefined" ||
      !event?.queryStringParameters?.handle ||
      event?.queryStringParameters?.handle === "undefined"
    ) {
      return {
        statusCode: 412,
        body: JSON.stringify({ error: "Invalid API request" }),
      };
    }

    const { status, txid, message } = await twitterApprover.approveTweet(
      event?.queryStringParameters?.tweetId,
      event?.queryStringParameters?.publicKey,
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
      body: JSON.stringify({ result: "done", txid, message }),
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
      body: JSON.stringify({ error: e.toString() }),
    };
  }
};
