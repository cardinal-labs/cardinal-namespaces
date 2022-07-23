/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import * as twitterApprover from "./twitter-revoker";

module.exports.revoke = async (event) => {
  const headers = {
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
  };
  try {
    // custom params for each identity namespace
    const namespace = event?.queryStringParameters?.namespace || "twitter";
    if (
      namespace === "twitter" &&
      (!event?.queryStringParameters?.tweetId ||
        event?.queryStringParameters?.tweetId === "undefined")
    ) {
      return {
        headers: headers,
        statusCode: 412,
        body: JSON.stringify({ error: "Invalid API request" }),
      };
    } else if (
      namespace === "discord" &&
      (!event?.queryStringParameters?.accessToken ||
        event?.queryStringParameters?.accessToken === "undefined")
    ) {
      return {
        headers: headers,
        statusCode: 412,
        body: JSON.stringify({ error: "Invalid API request" }),
      };
    } else {
      ("pass");
    }

    const { status, txid, message } = await twitterApprover.revokeHolder(
      namespace,
      event?.queryStringParameters?.publicKey,
      event?.queryStringParameters?.handle,
      event?.queryStringParameters?.tweetId,
      event?.queryStringParameters?.accessToken,
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
      headers: headers,
      body: JSON.stringify({ error: String(e) }),
    };
  }
};
