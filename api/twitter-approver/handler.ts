/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import * as twitterApprover from "./twitter-approver";

module.exports.approve = async (event) => {
  console.log(event.queryStringParameters);
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
    console.log(message);
    return {
      statusCode: status,
      body: JSON.stringify({ result: "done", txid, message }),
    };
  } catch (e) {
    console.log("Error approving claim request: ", e);
    return {
      statusCode: 500,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      body: JSON.stringify({ error: e.toString() }),
    };
  }
};
