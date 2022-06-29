import * as anchor from "@project-serum/anchor";
import { expectTXTable } from "@saberhq/chai-solana";
import { SolanaProvider, TransactionEnvelope } from "@saberhq/solana-contrib";
import * as web3 from "@solana/web3.js";
import assert from "assert";

import {
  getNamespaceByName,
  withCreateNamespace,
  withUpdateNamespace,
} from "../src";
import { getProvider } from "./workspace";

describe("create-update-namespace", () => {
  const provider = getProvider();

  // test params
  const namespaceName = `ns-${Math.random()}`;
  const paymentAmountDaily = new anchor.BN(0);

  it("Creates a namespace", async () => {
    const transaction = new web3.Transaction();
    await withCreateNamespace(
      transaction,
      provider.connection,
      provider.wallet,
      {
        namespaceName,
        updateAuthority: provider.wallet.publicKey,
        rentAuthority: provider.wallet.publicKey,
        approveAuthority: provider.wallet.publicKey,
        transferableEntries: false,
        limit: 1,
      }
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

  it("Updates a namespace", async () => {
    const transaction = new web3.Transaction();
    await withUpdateNamespace(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      {
        updateAuthority: provider.wallet.publicKey,
        rentAuthority: provider.wallet.publicKey,
        approveAuthority: provider.wallet.publicKey,
        transferableEntries: false,
        limit: 1,
      }
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
});
