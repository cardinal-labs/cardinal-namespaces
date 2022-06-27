import { utils } from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
  Transaction,
} from "@solana/web3.js";
import fetch from "node-fetch";
import { getNameEntriesForNamespace } from "../src";

import * as splToken from "@solana/spl-token";
import { connectionFor } from "./connection";
import {
  findAta,
  withFindOrInitAssociatedTokenAccount,
} from "@cardinal/common";

// wallet to airdrop from
const authority = Keypair.fromSecretKey(utils.bytes.bs58.decode(""));
const mints: string[] = [""];
const airdropMintId: PublicKey = new PublicKey("");
const airdropAmount: number = 1;
const namespaceName = "twitter";

export const airdropMintsOfNamespace = async (clusterName = "devnet") => {
  const connection = connectionFor(clusterName);
  let authorityAirdropMintAta: PublicKey | undefined;
  try {
    authorityAirdropMintAta = await findAta(
      airdropMintId,
      authority.publicKey,
      true
    );
  } catch (e) {
    console.log("No authority token account found airdrop mint");
  }
  const airdropMint = new splToken.Token(
    connection,
    airdropMintId,
    splToken.TOKEN_PROGRAM_ID,
    Keypair.generate() // not used
  );
  const airdropMintInfo = await airdropMint.getMintInfo();

  const mintToProfiles: {
    [key: string]: { mintId: string; collection: string }[];
  } = {};
  for (const mintId of mints) {
    // create mint to twitter handles mapping
    const response = await fetch(
      `https://inspect-app.optick.xyz/twitter-search/nft?chain=SOL&token=${mintId}`
    ).then((res) => res.json());

    mintToProfiles[mintId] = [];
    for (const profile of response.profiles) {
      mintToProfiles[mintId]?.push({
        mintId: profile.username,
        collection: profile.collection_id,
      });
    }
  }

  // find mint holder
  let holder: PublicKey | undefined;
  for (let [mintId, entries] of Object.entries(mintToProfiles)) {
    if (entries.length === 0) continue;
    const collection = entries[0]?.collection;
    const mintPubkey = new PublicKey(mintId);

    const nameEntries = (
      await getNameEntriesForNamespace(
        connection,
        namespaceName,
        entries.map((entry) => entry.mintId)
      )
    ).filter((entry) => !!entry.parsed);
    const wallets = nameEntries.map((entry) => entry.parsed.data?.toString());
    const mint = new splToken.Token(
      connection,
      mintPubkey,
      splToken.TOKEN_PROGRAM_ID,
      Keypair.generate() // not used
    );
    for (const wallet of wallets) {
      if (collection === "degods") {
        const response = await fetch("https://api.degods.com/v1/farmerstats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pubkey: wallet,
          }),
        });
        const json = (await response.json()) as StakedTokensResponse;
        if (json.gems) {
          for (const gem of json.gems) {
            console.log(gem.mint, mintPubkey.toString());
            if (gem.mint === mintPubkey.toString()) {
              holder = new PublicKey(wallet!);
              break;
            }
          }
        }
      } else {
        try {
          const userAta = await findAta(mintPubkey, new PublicKey(wallet!));
          const userAtaInfo = await mint.getAccountInfo(userAta);
          if (userAtaInfo.amount.toNumber() === 1) {
            holder = new PublicKey(wallet!);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // airdrop to holder
    if (holder) {
      console.log(
        `Airdropping ${airdropAmount} tokens to ${holder.toString()}`
      );
      const transaction = new Transaction();
      const holderTokenAccount = await withFindOrInitAssociatedTokenAccount(
        transaction,
        connection,
        airdropMint.publicKey,
        holder,
        authority.publicKey,
        true
      );
      transaction.add(
        splToken.Token.createTransferCheckedInstruction(
          splToken.TOKEN_PROGRAM_ID,
          authorityAirdropMintAta!,
          airdropMint.publicKey,
          holderTokenAccount,
          authority.publicKey,
          [authority],
          airdropAmount * 10 ** airdropMintInfo.decimals,
          airdropMintInfo.decimals
        )
      );
      try {
        transaction.feePayer = authority.publicKey;
        transaction.recentBlockhash = (
          await connection.getRecentBlockhash("max")
        ).blockhash;
        transaction.sign(authority);
        const txId = await sendAndConfirmRawTransaction(
          connection,
          transaction.serialize(),
          {
            commitment: "confirmed",
            skipPreflight: true,
          }
        );
        console.log(`Successful airdrop! TxId: ${txId}`);
      } catch (e) {
        console.log(`Something went wrong ${e}`);
      }
    } else {
      console.log(`Holder of mint ${mintId.toString()} not found`);
    }
  }
};

airdropMintsOfNamespace("mainnet").catch((e) => {
  console.log("Error:", e);
});

export type StakedTokensResponse = {
  farm: string;
  identity: string;
  vault: string;
  state: {
    staked: any;
  };
  unclaimedRewards: string;
  gemsStaked: string;
  minStakingEndsTs: string;
  cooldownEndsTs: string;
  gems?: {
    pubkey: string;
    mint: string;
    onchainMetadata: {
      key: number;
      updateAuthority: string;
      mint: string;
      data: {
        name: string;
        symbol: string;
        uri: string;
        sellerFeeBasisPoints: number;
        creators: [
          {
            address: string;
            verified: number;
            share: number;
          },
          {
            address: string;
            verified: number;
            share: number;
          }
        ];
      };
      primarySaleHappened: number;
      isMutable: number;
      editionNonce: number;
    };
    externalMetadata: {
      name: string;
      symbol: string;
      description: string;
      seller_fee_basis_points: number;
      image: string;
      external_url: string;
      attributes: { value: string; trait_type: string }[];
      collection: {
        name: string;
        family: string;
      };
      properties: {
        files: {
          uri: string;
          type: string;
        }[];
        category: string;
        creators: {
          address: string;
          share: number;
        }[];
      };
    };
  }[];
};
