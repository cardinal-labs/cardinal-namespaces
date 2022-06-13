import * as anchor from "@project-serum/anchor";
import { expectTXTable } from "@saberhq/chai-solana";
import { SolanaProvider, TransactionEnvelope } from "@saberhq/solana-contrib";
import type * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import assert from "assert";

import {
  findNamespaceId,
  getClaimRequest,
  getNameEntry,
  getNamespaceByName,
  getReverseEntry,
  withClaimNameEntry,
  withCreateClaimRequest,
  withCreateNamespace,
  withInitNameEntry,
  withInitNameEntryMint,
  withSetNamespaceReverseEntry,
  withUpdateClaimRequest,
} from "../src";
import { createMint } from "./utils";
import { getProvider } from "./workspace";

describe("create-claim-revoke-name-entry.spec", () => {
  const provider = getProvider();

  // test params
  const namespaceName = `ns-${Math.random()}`;
  const entryName = "testname";
  const mintAuthority = web3.Keypair.generate();
  const paymentAmountDaily = new anchor.BN(0);
  const PAYMENT_MINT_START = 10000;

  // global
  let paymentMint: splToken.Token;

  it("Creates a namespace", async () => {
    [, paymentMint] = await createMint(
      provider.connection,
      mintAuthority,
      provider.wallet.publicKey,
      PAYMENT_MINT_START
    );

    const transaction = new web3.Transaction();
    await withCreateNamespace(
      provider.connection,
      provider.wallet,
      namespaceName,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      0,
      paymentAmountDaily,
      paymentMint.publicKey,
      new anchor.BN(0),
      null,
      true,
      transaction
    );
    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        transaction.instructions
      ),
      "before",
      {
        verbosity: "error",
        formatLogs: true,
      }
    ).to.be.fulfilled;

    const checkNamespace = await getNamespaceByName(
      provider.connection,
      namespaceName
    );
    assert.equal(checkNamespace.parsed.name, namespaceName);
    assert.equal(checkNamespace.parsed.maxRentalSeconds, null);
    assert.equal(
      checkNamespace.parsed.paymentAmountDaily.toNumber(),
      paymentAmountDaily.toNumber()
    );
  });

  it("Initialize entry", async () => {
    const mintKeypair = web3.Keypair.generate();
    const transaction = new web3.Transaction();

    await withInitNameEntry(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName
    );

    await withInitNameEntryMint(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName,
      mintKeypair
    );
    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        transaction.instructions,
        [mintKeypair]
      ),
      "before",
      {
        verbosity: "error",
        formatLogs: true,
      }
    ).to.be.fulfilled;

    const checkEntry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName
    );
    assert.equal(checkEntry.parsed.name, entryName);
    assert.equal(
      checkEntry.parsed.mint.toString(),
      mintKeypair.publicKey.toString()
    );
  });

  it("Create claim request", async () => {
    const transaction = new web3.Transaction();

    await withCreateClaimRequest(
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName,
      provider.wallet.publicKey,
      transaction
    );

    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        transaction.instructions
      ),
      "before",
      {
        verbosity: "error",
        formatLogs: true,
      }
    ).to.be.fulfilled;
  });

  it("Approve claim request", async () => {
    const claimRequest = await getClaimRequest(
      provider.connection,
      namespaceName,
      entryName,
      provider.wallet.publicKey
    );
    const transaction = new web3.Transaction();
    await withUpdateClaimRequest(
      provider.connection,
      provider.wallet,
      namespaceName,
      claimRequest.pubkey,
      true,
      transaction
    );
    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        transaction.instructions
      ),
      "before",
      {
        verbosity: "error",
        formatLogs: true,
      }
    ).to.be.fulfilled;
  });

  it("Claim", async () => {
    const entry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName
    );
    const mintId = entry.parsed.mint;

    const transaction = new web3.Transaction();
    await withClaimNameEntry(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName,
      mintId
    );
    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        transaction.instructions
      ),
      "before",
      {
        verbosity: "error",
        formatLogs: true,
      }
    ).to.be.fulfilled;

    const checkNamespace = await getNamespaceByName(
      provider.connection,
      namespaceName
    );
    assert.equal(checkNamespace.parsed.name, namespaceName);
    const checkNameEntry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName
    );
    assert.equal(checkNameEntry.parsed.name, entryName);
    assert.equal(checkNameEntry.parsed.mint.toString(), mintId.toString());
  });

  it("Set reverse entry", async () => {
    const entry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName
    );
    const mintId = entry.parsed.mint;

    const transaction = new web3.Transaction();
    await withSetNamespaceReverseEntry(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName,
      mintId
    );
    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        transaction.instructions
      ),
      "before",
      {
        verbosity: "error",
        formatLogs: true,
      }
    ).to.be.fulfilled;

    const checkReverseEntry = await getReverseEntry(
      provider.connection,
      (
        await findNamespaceId(namespaceName)
      )[0],
      provider.wallet.publicKey
    );
    assert.equal(checkReverseEntry.parsed.entryName, entryName);
  });
});
