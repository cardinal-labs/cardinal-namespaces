/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import * as twitterApprover from "./twitter-revoker";

module.exports.revoke = async (event) => {
  try {
    const { status, txid, message } = await twitterApprover.revokeHolder(
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
    console.log("Error: ", e);
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
