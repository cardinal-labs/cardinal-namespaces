import { shortenAddress } from "@cardinal/namespaces";

import {
  tweetContainsPublicKey,
  verifyDiscord,
} from "../twitter-claimer/utils";

export async function verifyTweet(
  namespace: string,
  publicKey: string,
  entryName?: string,
  tweetId?: string,
  code?: string,
  accessToken?: string,
  cluster = "mainnet"
): Promise<{ status: number; message?: string; info?: any }> {
  if (!namespace || namespace === "twitter") {
    console.log(
      `Attempting to verify tweet for tweet (${tweetId!}) publicKey ${publicKey} entryName ${entryName!} cluster ${cluster} `
    );

    let tweetApproved = true;
    if (cluster !== "devnet") {
      try {
        tweetApproved = await tweetContainsPublicKey(
          tweetId!,
          entryName!,
          publicKey
        );
      } catch (e) {
        console.log("Failed twitter check: ", e);
        return {
          status: 401,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          message: e.message,
        };
      }
    }

    if (!tweetApproved) {
      return {
        status: 404,
        message: `Public key ${shortenAddress(
          publicKey
        )} not found in tweet ${tweetId!}`,
      };
    }
  } else if (namespace === "discord") {
    if (!code) {
      return {
        status: 401,
        message: `No code found in request URL`,
      };
    }

    console.log(
      `Attempting to verify discord handle publicKey ${publicKey} cluster ${cluster} `
    );
    const response = await verifyDiscord(code, accessToken);

    if (!response.verified) {
      return {
        status: 500,
        message: response.erroeMessage,
      };
    }

    return {
      status: 200,
      info: response.info,
    };
  } else {
    return {
      status: 400,
      message: "Invalid identity namespace",
    };
  }
  return {
    status: 200,
    message: `Succesfully verified claim publicKey (${publicKey}) for (${
      entryName ? "handle " + entryName : "discord"
    })`,
  };
}
