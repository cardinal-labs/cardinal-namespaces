/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

import * as twitterVerifier from "./twitter-verifier";

module.exports.verify = async (event) => {
  try {
    if (
      !event?.queryStringParameters?.publicKey ||
      event?.queryStringParameters?.publicKey === "undefined" ||
      !event?.queryStringParameters?.namespace ||
      event?.queryStringParameters?.namespace === "undefined"
    ) {
      return {
        statusCode: 412,
        body: JSON.stringify({ error: "Invalid API request" }),
      };
    }
    // custom params for each identity namespace
    const namespace = event?.queryStringParameters?.namespace;
    if (
      namespace === "twitter" &&
      (!event?.queryStringParameters?.tweetId ||
        event?.queryStringParameters?.tweetId === "undefined" ||
        !event?.queryStringParameters?.handle ||
        event?.queryStringParameters?.handle === "undefined")
    ) {
      return {
        statusCode: 412,
        body: JSON.stringify({ error: "Invalid API request" }),
      };
    } else if (
      namespace === "discord" &&
      (!event?.queryStringParameters?.code ||
        event?.queryStringParameters?.code === "undefined")
    ) {
      return {
        statusCode: 412,
        body: JSON.stringify({ error: "Invalid API request" }),
      };
    } else {
      ("pass");
    }

    console.log("accessToken", event?.queryStringParameters?.accessToken);
    const { status, message, info } = await twitterVerifier.verifyTweet(
      namespace,
      event?.queryStringParameters?.publicKey,
      event?.queryStringParameters?.handle,
      event?.queryStringParameters?.tweetId,
      event?.queryStringParameters?.code,
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
      body: JSON.stringify({ result: "done", message, info: info }),
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
      body: JSON.stringify({ error: (e as string).toString() }),
    };
  }
};
