import { findAta, tryGetAccount } from "@cardinal/common";
import { withInvalidate } from "@cardinal/token-manager";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { expectTXTable } from "@saberhq/chai-solana";
import { SolanaProvider, TransactionEnvelope } from "@saberhq/solana-contrib";
import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import assert from "assert";
import { expect } from "chai";

import {
  findNamespaceId,
  findReverseEntryId,
  getClaimRequest,
  getNameEntry,
  getNamespaceByName,
  getReverseEntry,
  withClaimNameEntry,
  withCreateClaimRequest,
  withCreateNamespace,
  withInitNameEntry,
  withInitNameEntryMint,
  withInvalidateExpiredNameEntry,
  withInvalidateExpiredReverseEntry,
  withSetNamespaceReverseEntry,
  withUpdateClaimRequest,
} from "../src";
import { getProvider } from "./workspace";

describe("set-reverse-entry-and-invalidate-name-entry", () => {
  const provider = getProvider();

  // test params
  const namespaceName = `ns-${Math.random()}`;
  const entryName1 = "testname1";
  const entryName2 = "testname2";

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
  });

  /// START NAME ENTRY 1 ///
  it("Init entry and mint", async () => {
    const mintKeypair = web3.Keypair.generate();
    const transaction = new web3.Transaction();

    await withInitNameEntry(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName1
    );

    await withInitNameEntryMint(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName1,
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
      entryName1
    );
    assert.equal(checkEntry.parsed.name, entryName1);
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
      entryName1,
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
      entryName1,
      provider.wallet.publicKey
    );
    const transaction = new web3.Transaction();
    await withUpdateClaimRequest(
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName1,
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
      entryName1
    );
    const mintId = entry.parsed.mint;

    const transaction = new web3.Transaction();
    await withClaimNameEntry(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName1,
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

    const checkClaimRequest = await tryGetAccount(async () =>
      getClaimRequest(
        provider.connection,
        namespaceName,
        entryName1,
        provider.wallet.publicKey
      )
    );
    expect(checkClaimRequest).to.eq(null);

    const checkNamespace = await getNamespaceByName(
      provider.connection,
      namespaceName
    );
    assert.equal(checkNamespace.parsed.name, namespaceName);
    const checkNameEntry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName1
    );
    assert.equal(checkNameEntry.parsed.name, entryName1);
    assert.equal(checkNameEntry.parsed.mint.toString(), mintId.toString());

    const checkRecipientTokenAccount = await new splToken.Token(
      provider.connection,
      mintId,
      TOKEN_PROGRAM_ID,
      web3.Keypair.generate()
    ).getAccountInfo(await findAta(mintId, provider.wallet.publicKey));
    expect(checkRecipientTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkRecipientTokenAccount.isFrozen).to.eq(true);
  });

  it("Set reverse entry", async () => {
    const entry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName1
    );
    const mintId = entry.parsed.mint;

    const transaction = new web3.Transaction();
    await withSetNamespaceReverseEntry(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName1,
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
      provider.wallet.publicKey,
      (
        await findNamespaceId(namespaceName)
      )[0]
    );
    assert.equal(checkReverseEntry.parsed.entryName, entryName1);
  });
  /// END NAME ENTRY 1 ///

  /// START NAME ENTRY 2 ///
  it("Init entry and mint", async () => {
    const mintKeypair = web3.Keypair.generate();
    const transaction = new web3.Transaction();

    await withInitNameEntry(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName2
    );

    await withInitNameEntryMint(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName2,
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
      entryName2
    );
    assert.equal(checkEntry.parsed.name, entryName2);
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
      entryName2,
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
      entryName2,
      provider.wallet.publicKey
    );
    const transaction = new web3.Transaction();
    await withUpdateClaimRequest(
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName2,
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
      entryName2
    );
    const mintId = entry.parsed.mint;

    const transaction = new web3.Transaction();
    await withClaimNameEntry(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName2,
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

    const checkClaimRequest = await tryGetAccount(async () =>
      getClaimRequest(
        provider.connection,
        namespaceName,
        entryName2,
        provider.wallet.publicKey
      )
    );
    expect(checkClaimRequest).to.eq(null);

    const checkNamespace = await getNamespaceByName(
      provider.connection,
      namespaceName
    );
    assert.equal(checkNamespace.parsed.name, namespaceName);
    const checkNameEntry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName2
    );
    assert.equal(checkNameEntry.parsed.name, entryName2);
    assert.equal(checkNameEntry.parsed.mint.toString(), mintId.toString());

    const checkRecipientTokenAccount = await new splToken.Token(
      provider.connection,
      mintId,
      TOKEN_PROGRAM_ID,
      web3.Keypair.generate()
    ).getAccountInfo(await findAta(mintId, provider.wallet.publicKey));
    expect(checkRecipientTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkRecipientTokenAccount.isFrozen).to.eq(true);
  });

  it("Set reverse entry", async () => {
    const entry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName2
    );
    const mintId = entry.parsed.mint;

    const transaction = new web3.Transaction();
    await withSetNamespaceReverseEntry(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName2,
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
      provider.wallet.publicKey,
      (
        await findNamespaceId(namespaceName)
      )[0]
    );
    assert.equal(checkReverseEntry.parsed.entryName, entryName2);
  });
  /// END NAME ENTRY 2 ///

  it("Invalidate token", async () => {
    const transaction = new web3.Transaction();
    const checkNameEntry1 = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName1
    );
    const mintId = checkNameEntry1.parsed.mint;

    await withInvalidate(
      transaction,
      provider.connection,
      provider.wallet,
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

    const checkRecipientTokenAccount = await new splToken.Token(
      provider.connection,
      mintId,
      TOKEN_PROGRAM_ID,
      web3.Keypair.generate()
    ).getAccountInfo(await findAta(mintId, provider.wallet.publicKey));
    expect(checkRecipientTokenAccount.amount.toNumber()).to.eq(0);
  });

  it("Invalidate name entry", async () => {
    const transaction = new web3.Transaction();
    const checkNameEntry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName1
    );
    const mintId = checkNameEntry.parsed.mint;
    const [namespaceId] = await findNamespaceId(namespaceName);
    const reverseEntryData = await tryGetAccount(() =>
      getReverseEntry(
        provider.connection,
        provider.wallet.publicKey,
        namespaceId
      )
    );
    const namespaceDataBefore = await getNamespaceByName(
      provider.connection,
      namespaceName
    );

    // only do if names match
    if (reverseEntryData && reverseEntryData.parsed.entryName === entryName1) {
      await withInvalidateExpiredReverseEntry(
        transaction,
        provider.connection,
        provider.wallet,
        {
          namespaceName,
          entryName: entryName1,
          mintId: mintId,
          reverseEntryId: reverseEntryData.pubkey,
        }
      );
    } else {
      console.log("Skipping invalidating expired reverse entry");
    }

    await withInvalidateExpiredNameEntry(
      transaction,
      provider.connection,
      provider.wallet,
      {
        namespaceName: namespaceName,
        mintId: mintId,
        entryName: entryName1,
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

    const namespaceDataAfter = await getNamespaceByName(
      provider.connection,
      namespaceName
    );

    expect(namespaceDataAfter.parsed.count).to.eq(
      namespaceDataBefore.parsed.count - 1
    );

    const [reverseEntryId] = await findReverseEntryId(
      (
        await findNamespaceId(namespaceName)
      )[0],
      provider.wallet.publicKey
    );
    expect(checkNameEntry.parsed.reverseEntry?.toString()).to.eq(
      reverseEntryId.toString()
    );
    // const checkReverseEntry = await tryGetAccount(async () =>
    //   getReverseEntry(
    //     provider.connection,
    //     provider.wallet.publicKey,
    //     (
    //       await findNamespaceId(namespaceName)
    //     )[0]
    //   )
    // );
    // expect(checkReverseEntry).to.eq(null);

    const entryAfter = await tryGetAccount(() =>
      getNameEntry(provider.connection, namespaceName, entryName1)
    );
    expect(entryAfter?.parsed.isClaimed).to.be.false;
    expect(entryAfter?.parsed.data).to.be.null;

    const checkNamespaceTokenAccount = await new splToken.Token(
      provider.connection,
      checkNameEntry.parsed.mint,
      TOKEN_PROGRAM_ID,
      web3.Keypair.generate()
    ).getAccountInfo(
      await findAta(
        checkNameEntry.parsed.mint,
        (
          await findNamespaceId(namespaceName)
        )[0],
        true
      )
    );
    expect(checkNamespaceTokenAccount.amount.toNumber()).to.eq(1);
  });
});
