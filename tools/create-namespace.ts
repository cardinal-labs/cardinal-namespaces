import { BN, utils } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import {
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
  Transaction,
} from "@solana/web3.js";

import { withCreateNamespace } from "../src";
import { connectionFor } from "./connection";

export const createNamespace = async (name: string) => {
  const connection = connectionFor("devnet");
  let transaction = new Transaction();

  // kycLcoGB9Lf1j1mLxbaYcR3HUgBywHBxmLJPcvFr5BP
  const wallet = Keypair.fromSecretKey(
    utils.bytes.bs58.decode(
      "2SogHyWWyJxRpNjgjhRGRAWfsNaYYDjYx3Z9FyJLi926N6nC3tWMjEVtzMdKmDJiDvpoeRu3Sjin6g1cLBxib8Ed"
    )
  );

  transaction = await withCreateNamespace(
    connection,
    new SignerWallet(wallet),
    name,
    wallet.publicKey,
    wallet.publicKey,
    wallet.publicKey,
    0,
    new BN(0),
    new PublicKey("So11111111111111111111111111111111111111112"),
    new BN(0),
    null,
    false,
    transaction
  );
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;
  transaction.sign(wallet);
  await sendAndConfirmRawTransaction(connection, transaction.serialize(), {
    commitment: "confirmed",
  });
};

createNamespace("empiredao-registration")
  .then(() => {
    console.log("success");
  })
  .catch((e) => {
    console.log("Error:", e);
  });
