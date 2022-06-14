import { tryGetAccount } from "@cardinal/common";
import * as namespaces from "@cardinal/namespaces";
import { NAMESPACES_PROGRAM_ID } from "@cardinal/namespaces";
import * as anchor from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";

import { secondaryConnectionFor } from "../common/connection";

export async function getOwner(
  connection: web3.Connection,
  mint: web3.PublicKey
) {
  const largestHolders = await connection.getTokenLargestAccounts(mint);
  const certificateMintToken = new splToken.Token(
    connection,
    mint,
    splToken.TOKEN_PROGRAM_ID,
    // not used
    anchor.web3.Keypair.generate()
  );

  const largestTokenAccount =
    largestHolders?.value[0]?.address &&
    (await certificateMintToken.getAccountInfo(
      largestHolders?.value[0]?.address
    ));
  return largestTokenAccount.owner;
}

export async function tryGetNameEntry(
  connection: web3.Connection,
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
  connection: web3.Connection,
  namespaceName: string,
  entryName: string,
  user: web3.PublicKey
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

export async function revoke(
  cluster: string,
  connection: web3.Connection,
  wallet: web3.Keypair,
  namespaceName: string,
  entryName: string,
  claimRequestId: web3.PublicKey
) {
  const entry = await tryGetNameEntry(connection, namespaceName, entryName);
  if (!entry) throw new Error(`No entry for ${entryName} to be revoked`);

  const owner = await getOwner(
    secondaryConnectionFor(cluster),
    entry.parsed.mint
  );
  const transaction = new web3.Transaction();

  if (entry?.parsed.reverseEntry) {
    const reverseEntryId = entry?.parsed.reverseEntry;
    console.log(
      `Revoking reverse entry ${reverseEntryId.toString()} using claimId ${claimRequestId.toString()} from owner ${owner.toString()}`
    );
    const reverseEntry = await connection.getAccountInfo(reverseEntryId);
    if (reverseEntry) {
      await namespaces.withRevokeReverseEntry(
        transaction,
        connection,
        new SignerWallet(wallet),
        namespaceName,
        entryName,
        reverseEntryId,
        claimRequestId
      );
    }
  }

  console.log(
    `Revoking entry ${entryName} using claimId ${claimRequestId.toString()} from owner ${owner.toString()}`
  );

  const ownerAccountInfo = await connection.getAccountInfo(owner);
  if (ownerAccountInfo?.owner.toString() !== NAMESPACES_PROGRAM_ID.toString()) {
    await namespaces.deprecated.withRevokeEntry(
      connection,
      new SignerWallet(wallet),
      namespaceName,
      entryName,
      entry?.parsed.mint,
      owner,
      claimRequestId,
      transaction
    );
  }

  let txid;
  if (transaction.instructions.length > 0) {
    console.log(
      `Executing transaction of length ${transaction.instructions.length}`
    );
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (
      await connection.getRecentBlockhash("max")
    ).blockhash;
    txid = await web3.sendAndConfirmTransaction(connection, transaction, [
      wallet,
    ]);
    console.log(
      `Succesfully revoke entries from ${owner.toString()}, txid (${txid})`
    );
  } else {
    return "";
  }
  return txid;
}
