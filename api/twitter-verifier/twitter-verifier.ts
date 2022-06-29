import { shortenAddress } from "@cardinal/namespaces";

import { tweetContainsPublicKey } from "../twitter-claimer/utils";

export async function verifyTweet(
  tweetId: string,
  publicKey: string,
  entryName: string,
  cluster = "mainnet"
): Promise<{ status: number; message?: string }> {
  console.log(
    `Attempting to verify tweet for tweet (${tweetId}) publicKey ${publicKey} entryName ${entryName} cluster ${cluster} `
  );

  let tweetApproved = true;
  if (cluster !== "devnet") {
    try {
      tweetApproved = await tweetContainsPublicKey(
        tweetId,
        entryName,
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
      )} not found in tweet ${tweetId}`,
    };
  }
  return {
    status: 200,
    message: `Succesfully verified claim publicKey (${publicKey}) for handle (${entryName})`,
  };
}
