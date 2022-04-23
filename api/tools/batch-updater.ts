import type { AccountData, EntryData } from "@cardinal/namespaces";
import {
  formatName,
  NAMESPACE_SEED,
  NAMESPACES_IDL,
  NAMESPACES_PROGRAM_ID,
  withUpdateMintMetadata,
} from "@cardinal/namespaces";
import * as metaplex from "@metaplex/js";
import * as anchor from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import * as web3 from "@solana/web3.js";

import { connectionFor } from "../common/connection";

// twtQEtj1wnNmSZZ475prwBFPbPit6w88YSfjia83g4k
const WALLET = web3.Keypair.fromSecretKey(
  anchor.utils.bytes.bs58.decode(process.env.TWITTER_SOLANA_KEY || "")
);

const updateEntryMintMetadata = async (
  namespaceName = "twitter",
  cluster = "mainnet"
) => {
  console.log("Approving claim request");
  const connection = connectionFor(cluster);

  const nameEntries = await getNameEntriesInNamespace(
    connection,
    namespaceName
  );

  for (let i = 0; i < nameEntries.length; i++) {
    const nameEntry = nameEntries[i];
    console.log(
      `${formatName(namespaceName, nameEntry.parsed.name as string)}`
    );
    const metadata = await tryGetMetadata(connection, nameEntry.parsed.mint);
    if (
      metadata &&
      metadata.data.data.uri.includes("api.cardinal.so/metadata")
    ) {
      console.log(
        `Skipping ${formatName(
          namespaceName,
          nameEntry.parsed.name as string
        )} because it is already set correctly`
      );
    } else {
      const transaction = new web3.Transaction();
      await withUpdateMintMetadata(
        connection,
        new SignerWallet(WALLET),
        nameEntry.parsed.namespace,
        nameEntry.pubkey,
        nameEntry.parsed.mint,
        transaction
      );

      console.log(
        `Attempting to update (${formatName(
          namespaceName,
          nameEntry.parsed.name as string
        )}) in (${namespaceName})`
      );
      transaction.feePayer = WALLET.publicKey;
      transaction.recentBlockhash = (
        await connection.getRecentBlockhash("max")
      ).blockhash;
      const txid = await web3.sendAndConfirmTransaction(
        connection,
        transaction,
        [WALLET]
      );
      console.log(
        `Successfully updated (${formatName(
          namespaceName,
          nameEntry.parsed.name as string
        )}) in (${namespaceName}) with txid (${txid})`
      );
    }
  }
};

export async function tryGetMetadata(
  connection: web3.Connection,
  mint: web3.PublicKey
) {
  try {
    const [metaplexId] = await web3.PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(
          metaplex.programs.metadata.MetadataProgram.PREFIX
        ),
        metaplex.programs.metadata.MetadataProgram.PUBKEY.toBuffer(),
        mint.toBuffer(),
      ],
      metaplex.programs.metadata.MetadataProgram.PUBKEY
    );

    return await metaplex.programs.metadata.Metadata.load(
      connection,
      metaplexId
    );
  } catch (e) {
    console.log(`Failed to get metadata for mint ${mint.toString()}: `, e);
    return null;
  }
}

/*
 * TODO should not expose this
 * @param connection
 * @param namespaceName
 * @returns
 */
export async function getNameEntriesInNamespace(
  connection: web3.Connection,
  namespaceName: string
): Promise<AccountData<EntryData>[]> {
  const coder = new anchor.BorshCoder(NAMESPACES_IDL);
  const programAccounts = await connection.getProgramAccounts(
    NAMESPACES_PROGRAM_ID
  );

  const [namespaceId] = await web3.PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(namespaceName),
    ],
    NAMESPACES_PROGRAM_ID
  );

  const namespaceEntries: AccountData<EntryData>[] = [];
  programAccounts.forEach((account) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const entryData = coder.accounts.decode("entry", account.account.data);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      if (entryData.namespace.toString() === namespaceId.toString()) {
        namespaceEntries.push({
          ...account,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          parsed: entryData,
        });
      }
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Failed to decode name entry ${e}`);
    }
  });
  return namespaceEntries;
}

updateEntryMintMetadata("twitter", "devnet").catch((e) => {
  console.log(e);
});
