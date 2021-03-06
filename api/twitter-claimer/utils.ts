/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { findAta } from "@cardinal/common";
import * as namespaces from "@cardinal/namespaces";
import * as splToken from "@solana/spl-token";
import type { Connection, PublicKey } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import fetch from "node-fetch";

import type {
  DiscordResponseParams,
  DiscordUserInfoParams,
  DiscordVerificationResponse,
} from "../tools/types";

export const TWITTER_API_KEYS = [
  "AAAAAAAAAAAAAAAAAAAAAC7iXgEAAAAAH%2BlE4oemN1y5aLOsCimsV32G9Cs%3DKgaXQRuggNA5UzuJmN1X9twXNARy7qxSiBxNf4oCc6CxKwIhxa",
  "AAAAAAAAAAAAAAAAAAAAAIeiYAEAAAAA0xfvS2Oonb3ijLTis8MmrSsRWm0%3DotAZj0h9Aq6qEa7VKLckzfeRH3eDxj2Gp69rxD4B7pJlf7kdQy",
  "AAAAAAAAAAAAAAAAAAAAAOz4ZgEAAAAAYQ%2F6yZsduzzRyIDsGuUlvbSM4nE%3DFzVAxwlczyaSn8tD2VqJN7AcgR97zcDXBLYZDrAwV8VLdrSKJM",
  "AAAAAAAAAAAAAAAAAAAAANcAbQEAAAAA6jd7gLquooPwcvc%2B%2F%2FNz62cp3Og%3DFNeW1ZQd6vunLwPZBS8mN65Sa7nn0mVc6sXTs7PhxXWt0VBOXA",
  "AAAAAAAAAAAAAAAAAAAAAAuSfAEAAAAA%2B0N%2Bz14VMyAYgtn3a7jn%2F3yJDZw%3D9u5GCWG9s2G7iZmfBAbAWZlVObA3N9Tehlfx0B1tHN4aWbFOhr",
];

export type TweetJson = {
  data: { text: string };
  includes: { users: { username: string }[] };
};

export const tweetContainsPublicKey = async (
  tweetId: string,
  entryName: string,
  publicKey: string
): Promise<boolean> => {
  let tweetJson: TweetJson | undefined;
  let userHandle: string | undefined;
  for (let i = 0; i < TWITTER_API_KEYS.length; i++) {
    if (!userHandle) {
      try {
        const tweetResponse = await fetch(
          `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=created_at&expansions=author_id`,
          {
            headers: {
              authorization: `Bearer ${TWITTER_API_KEYS[i]!}`,
            },
          }
        );
        tweetJson = (await tweetResponse.json()) as TweetJson;
        userHandle = tweetJson.includes.users[0].username;
      } catch (e) {
        console.log("Invalid twitter API response", e);
        if (i === TWITTER_API_KEYS.length - 1) {
          throw new Error(`Invalid twitter API response`);
        }
      }
    }
  }
  if (userHandle !== entryName) {
    throw new Error(
      `Handle ${userHandle || ""} does not match requested name ${entryName}`
    );
  }
  return tweetJson?.data.text.includes(publicKey) ?? false;
};

export const tryGetAta = async (
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
): Promise<splToken.AccountInfo | undefined> => {
  try {
    const namespaceTokenAccountId = await findAta(mint, owner, true);
    const tokenMint = new splToken.Token(
      connection,
      mint,
      splToken.TOKEN_PROGRAM_ID,
      Keypair.generate()
    );
    return tokenMint.getAccountInfo(namespaceTokenAccountId);
  } catch (e) {
    console.log("Failed to get ata");
  }
};

export async function tryGetNameEntry(
  connection: Connection,
  namespaceName: string,
  entryName: string
) {
  try {
    const entry = await namespaces.getNameEntry(
      connection,
      namespaceName,
      entryName
    );
    return entry;
  } catch (e) {
    return null;
  }
}

export async function tryGetClaimRequest(
  connection: Connection,
  namespaceName: string,
  entryName: string,
  user: PublicKey
) {
  try {
    const entry = await namespaces.getClaimRequest(
      connection,
      namespaceName,
      entryName,
      user
    );
    return entry;
  } catch (e) {
    console.log("Failed to get claim request:", e);
    return null;
  }
}

export const verifyDiscord = async (
  code: string,
  accessToken?: string
): Promise<DiscordVerificationResponse> => {
  // get access token
  const params = new URLSearchParams();
  params.append("client_id", "992004845101916191");
  params.append("client_secret", "D5ZJTxmYUxerC5zubMk4fHSx9veuD8RG");
  params.append("grant_type", "authorization_code");
  params.append("code", code.toString());
  params.append(
    "redirect_uri",
    "http://localhost:3000/verification?linkingFlow=discord"
  );
  params.append("scope", "identify");

  if (!accessToken) {
    const response = await fetch("https://discord.com/api/v10//oauth2/token", {
      method: "POST",
      body: params,
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
      },
    });
    const json = await response.json();
    let parsedResponse: DiscordResponseParams | undefined;
    try {
      parsedResponse = json as DiscordResponseParams;
      accessToken = parsedResponse?.access_token;
    } catch (e) {
      return {
        verified: false,
        erroeMessage: "Error parsing server response",
      };
    }
  }

  // get user information
  const userResponse = await fetch("http://discordapp.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const userJson = await userResponse.json();
  let parsedUserResponse: DiscordUserInfoParams | undefined;
  try {
    parsedUserResponse = userJson as DiscordUserInfoParams;
  } catch (e) {
    return {
      verified: false,
      erroeMessage: "Error parsing server response",
    };
  }
  const username = `${parsedUserResponse?.username}#${parsedUserResponse?.discriminator}`;

  const imageURI = `https://cdn.discordapp.com/avatars/${parsedUserResponse?.id}/${parsedUserResponse?.avatar}.png`;
  console.log(`Verified username ${username} with image ${imageURI}`);
  return {
    verified: true,
    info: {
      username: username,
      imageURI: imageURI,
      accessToken: accessToken,
    },
  };
};
