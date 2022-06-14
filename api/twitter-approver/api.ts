import * as namespaces from "@cardinal/namespaces";
import { SignerWallet } from "@saberhq/solana-contrib";
import * as web3 from "@solana/web3.js";

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
    return null;
  }
}

export async function approveClaimRequestTransaction(
  connection: web3.Connection,
  wallet: web3.Keypair,
  namespaceName: string,
  entryName: string,
  user: web3.PublicKey
) {
  const tryClaimRequest = await tryGetClaimRequest(
    connection,
    namespaceName,
    entryName,
    user
  );
  const transaction = new web3.Transaction();
  if (!tryClaimRequest) {
    console.log("Creating claim request");
    await namespaces.withCreateClaimRequest(
      connection,
      new SignerWallet(wallet),
      namespaceName,
      entryName,
      user,
      transaction
    );
  }

  if (!tryClaimRequest || !tryClaimRequest?.parsed?.isApproved) {
    console.log("Approving claim request");
    const [claimRequestId] = await namespaces.claimRequestId(
      namespaceName,
      entryName,
      user
    );

    await namespaces.withUpdateClaimRequest(
      connection,
      new SignerWallet(wallet),
      namespaceName,
      entryName,
      claimRequestId,
      true,
      transaction
    );
  }
  return transaction;
}

export async function approveClaimRequest(
  connection: web3.Connection,
  wallet: web3.Keypair,
  namespaceName: string,
  entryName: string,
  user: web3.PublicKey
) {
  const transaction = await approveClaimRequestTransaction(
    connection,
    wallet,
    namespaceName,
    entryName,
    user
  );
  if (transaction.instructions.length > 0) {
    console.log(
      `Executing transaction of length ${transaction.instructions.length}`
    );
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (
      await connection.getRecentBlockhash("max")
    ).blockhash;
    return await web3.sendAndConfirmTransaction(connection, transaction, [
      wallet,
    ]);
  } else {
    return "";
  }
}
