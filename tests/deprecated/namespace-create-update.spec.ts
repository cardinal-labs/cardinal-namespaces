import * as anchor from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import type * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import assert from "assert";
import { BN } from "bn.js";

import {
  getNamespace,
  NAMESPACES_PROGRAM_ID,
  withCreateNamespace,
  withUpdateNamespace,
} from "../../src";
import { createMint, NAMESPACE_SEED } from "../utils";
import { getProvider } from "../workspace";

describe("namespace-create-update", () => {
  const provider = getProvider();

  const mintAuthority = web3.Keypair.generate();
  const NAMESPACE_NAME = `ns2-${Math.random()}`;
  let paymentMint: splToken.Token;

  it("Creates a namespace", async () => {
    [, paymentMint] = await createMint(
      provider.connection,
      mintAuthority,
      provider.wallet.publicKey
    );

    const [namespaceId] = await web3.PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
        anchor.utils.bytes.utf8.encode(NAMESPACE_NAME),
      ],
      NAMESPACES_PROGRAM_ID
    );

    const transaction = new web3.Transaction();

    await withCreateNamespace(
      transaction,
      provider.connection,
      provider.wallet,
      {
        namespaceName: NAMESPACE_NAME,
        updateAuthority: provider.wallet.publicKey,
        rentAuthority: provider.wallet.publicKey,
        approveAuthority: provider.wallet.publicKey,
        minRentalSeconds: new BN(100),
        maxRentalSeconds: new BN(86400),
        paymentAmountDaily: new BN(1),
        paymentMint: paymentMint.publicKey,
        transferableEntries: true,
      }
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

    const namespaceAccount = await getNamespace(
      provider.connection,
      namespaceId
    );
    assert.equal(namespaceAccount.parsed.name, NAMESPACE_NAME);
    assert.equal(namespaceAccount.parsed.maxRentalSeconds, 86400);
  });

  it("Update a namespace not authority", async () => {
    const transaction = new web3.Transaction();
    await withUpdateNamespace(
      transaction,
      provider.connection,
      provider.wallet,
      NAMESPACE_NAME,
      {
        updateAuthority: mintAuthority.publicKey,
        rentAuthority: mintAuthority.publicKey,
        approveAuthority: mintAuthority.publicKey,
        minRentalSeconds: new BN(100),
        maxRentalSeconds: new BN(86400),
        paymentAmountDaily: new BN(1),
        paymentMint: paymentMint.publicKey,
        transferableEntries: true,
      }
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
      NAMESPACES_PROGRAM_ID
    );

    const transaction = new web3.Transaction();
    await withUpdateNamespace(
      transaction,
      provider.connection,
      provider.wallet,
      NAMESPACE_NAME,
      {
        updateAuthority: provider.wallet.publicKey,
        rentAuthority: provider.wallet.publicKey,
        approveAuthority: provider.wallet.publicKey,
        minRentalSeconds: new BN(100),
        maxRentalSeconds: new BN(86500),
        paymentAmountDaily: new BN(1),
        paymentMint: paymentMint.publicKey,
        transferableEntries: true,
      }
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

    const namespaceAccount = await getNamespace(
      provider.connection,
      namespaceId
    );
    assert.equal(namespaceAccount.parsed.name, NAMESPACE_NAME);
    assert.equal(namespaceAccount.parsed.maxRentalSeconds, 86500);
  });
});
