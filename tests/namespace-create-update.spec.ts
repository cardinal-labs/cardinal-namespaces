import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import { Namespaces } from "../../../target/types/namespaces";
import assert from "assert";
import { withCreateNamespace, withUpdateNamespace } from "../src";
import { NAMESPACE_SEED, createMint } from "./utils";
import { SignerWallet } from "@saberhq/solana-contrib";

describe("namespace-create-update", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Namespaces as anchor.Program<Namespaces>;
  const mintAuthority = web3.Keypair.generate();
  const NAMESPACE_NAME = "ns2";
  let paymentTokenAccount = null;
  let paymentMint: splToken.Token = null;

  it("Creates a namespace", async () => {
    [paymentTokenAccount, paymentMint] = await createMint(
      provider.connection,
      mintAuthority,
      provider.wallet.publicKey
    );

    const [namespaceId, bump] = await web3.PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
        anchor.utils.bytes.utf8.encode(NAMESPACE_NAME),
      ],
      program.programId
    );

    const transaction = new web3.Transaction();

    await withCreateNamespace(
      provider.connection,
      provider.wallet,
      NAMESPACE_NAME,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      0,
      new anchor.BN(1),
      paymentMint.publicKey,
      new anchor.BN(100),
      new anchor.BN(86400),
      false,
      transaction
    );
    transaction.feePayer = provider.wallet.publicKey;
    transaction.recentBlockhash = (
      await provider.connection.getRecentBlockhash("max")
    ).blockhash;
    await provider.wallet.signTransaction(transaction);
    await web3.sendAndConfirmRawTransaction(
      provider.connection,
      transaction.serialize()
    );

    const namespaceAccount = await program.account.namespace.fetch(namespaceId);
    assert.equal(namespaceAccount.name, NAMESPACE_NAME);
    assert.equal(namespaceAccount.maxRentalSeconds, 86400);
  });

  it("Update a namespace not authority", async () => {
    const [namespaceId] = await web3.PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
        anchor.utils.bytes.utf8.encode(NAMESPACE_NAME),
      ],
      program.programId
    );

    const transaction = new web3.Transaction();
    await withUpdateNamespace(
      provider.connection,
      provider.wallet,
      NAMESPACE_NAME,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      new anchor.BN(1),
      paymentMint.publicKey,
      new anchor.BN(100),
      new anchor.BN(86400),
      true,
      transaction
    );
    transaction.feePayer = mintAuthority.publicKey;
    transaction.recentBlockhash = (
      await provider.connection.getRecentBlockhash("max")
    ).blockhash;
    await new SignerWallet(mintAuthority).signTransaction(transaction);

    await assert.rejects(async () => {
      await web3.sendAndConfirmRawTransaction(
        provider.connection,
        transaction.serialize()
      );
    });
  });

  it("Update a namespace", async () => {
    const [namespaceId] = await web3.PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
        anchor.utils.bytes.utf8.encode(NAMESPACE_NAME),
      ],
      program.programId
    );

    const transaction = new web3.Transaction();
    await withUpdateNamespace(
      provider.connection,
      provider.wallet,
      NAMESPACE_NAME,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      new anchor.BN(1),
      paymentMint.publicKey,
      new anchor.BN(100),
      new anchor.BN(86500),
      true,
      transaction
    );
    transaction.feePayer = provider.wallet.publicKey;
    transaction.recentBlockhash = (
      await provider.connection.getRecentBlockhash("max")
    ).blockhash;
    await provider.wallet.signTransaction(transaction);
    await web3.sendAndConfirmRawTransaction(
      provider.connection,
      transaction.serialize()
    );

    const namespaceAccount = await program.account.namespace.fetch(namespaceId);
    assert.equal(namespaceAccount.name, NAMESPACE_NAME);
    assert.equal(namespaceAccount.maxRentalSeconds, 86500);
  });
});
