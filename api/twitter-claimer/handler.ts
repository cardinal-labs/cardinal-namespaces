/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { tryPublicKey } from "@cardinal/common";

import * as twitterClaimer from "./twitter-claimer";

module.exports.claim = async (event) => {
  const headers = {
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
  };
  const data = JSON.parse(event.body);
  const account = data.account as string;
  try {
    if (
      !account ||
      !tryPublicKey(account) ||
      !event?.queryStringParameters?.handle ||
      event?.queryStringParameters?.handle === "undefined" ||
      !event?.queryStringParameters?.namespace ||
      event?.queryStringParameters?.namespace === "undefined"
    ) {
      return {
        headers: headers,
        statusCode: 412,
        body: JSON.stringify({ error: "Invalid API request" }),
      };
    }

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

    // account for special characters
    let handle = String(event?.queryStringParameters?.handle);
    if (namespace === "discord") {
      const temp = handle.split(">");
      handle = temp.slice(0, -1).join() + "#" + String(temp.pop());
    }
    const response = await twitterClaimer.claimTransaction(
      event?.queryStringParameters?.namespace,
      account,
      handle,
      event?.queryStringParameters?.tweetId,
      event?.queryStringParameters?.accessToken,
      event?.queryStringParameters?.cluster
    );
    return {
      headers: headers,
      statusCode: response.status,
      body: JSON.stringify({
        result: "done",
        transaction: response.transaction || "",
        message: response.message || "",
      }),
    };
  } catch (e) {
    console.log("Error building claim transaction: ", e);
    return {
      headers: headers,
      statusCode: 500,
      body: JSON.stringify({ error: String(e) }),
    };
  }
};
