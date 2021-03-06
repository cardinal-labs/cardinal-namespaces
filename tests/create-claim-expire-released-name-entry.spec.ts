import { findAta, tryGetAccount } from "@cardinal/common";
import { withInvalidate } from "@cardinal/token-manager";
import { InvalidationType } from "@cardinal/token-manager/dist/cjs/programs/tokenManager";
import * as anchor from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { expectTXTable } from "@saberhq/chai-solana";
import {
  SignerWallet,
  SolanaProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
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
  withInvalidateTransferableNameEntry,
  withInvalidateTransferableReverseEntry,
  withSetNamespaceReverseEntry,
  withUpdateClaimRequest,
} from "../src";
import { createMint } from "./utils";
import { getProvider } from "./workspace";

describe("create-claim-expire-released-name-entry", () => {
  const provider = getProvider();

  // test params
  const namespaceName = `ns-${Math.random()}`;
  const entryName = "testname";
  const mintKeypair = web3.Keypair.generate();
  const nameEntryMint = mintKeypair.publicKey;
  const mintAuthority = web3.Keypair.generate();
  const invalidator = web3.Keypair.generate();
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

    // airdrop invalidator
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        invalidator.publicKey,
        web3.LAMPORTS_PER_SOL
      )
    );

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
        paymentAmountDaily,
        paymentMint: paymentMint.publicKey,
        transferableEntries: false,
        maxExpiration: new anchor.BN(Date.now() / 1000 + 1),
        invalidationType: InvalidationType.Release,
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

  it("Init entry and mint", async () => {
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
      entryName,
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
    const transaction = new web3.Transaction();
    await withClaimNameEntry(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName,
      nameEntryMint
    );
    await withSetNamespaceReverseEntry(
      transaction,
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName,
      nameEntryMint
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
        entryName,
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
      entryName
    );
    assert.equal(checkNameEntry.parsed.name, entryName);
    assert.equal(
      checkNameEntry.parsed.mint.toString(),
      nameEntryMint.toString()
    );

    const checkRecipientTokenAccount = await new splToken.Token(
      provider.connection,
      nameEntryMint,
      TOKEN_PROGRAM_ID,
      web3.Keypair.generate()
    ).getAccountInfo(await findAta(nameEntryMint, provider.wallet.publicKey));
    expect(checkRecipientTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkRecipientTokenAccount.isFrozen).to.eq(true);

    const checkReverseEntry = await getReverseEntry(
      provider.connection,
      provider.wallet.publicKey,
      (
        await findNamespaceId(namespaceName)
      )[0]
    );
    assert.equal(checkReverseEntry.parsed.entryName, entryName);
  });

  it("Fails to invalidate early", async () => {
    const transaction = new web3.Transaction();
    await withInvalidate(
      transaction,
      provider.connection,
      new SignerWallet(invalidator),
      nameEntryMint
    );
    expect(async () => {
      await expectTXTable(
        new TransactionEnvelope(SolanaProvider.init(provider), [
          ...transaction.instructions,
        ]),
        "Fail close"
      ).to.be.rejectedWith(Error);
    });
  });

  it("Wait and invalidate token", async () => {
    await new Promise((r) => setTimeout(r, 1000));
    const nameEntry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName
    );
    const mintId = nameEntry.parsed.mint;

    const transaction = new web3.Transaction();
    await withInvalidate(
      transaction,
      provider.connection,
      new SignerWallet(invalidator),
      mintId
    );
    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init({
          connection: provider.connection,
          wallet: new SignerWallet(invalidator),
          opts: provider.opts,
        }),
        transaction.instructions
      ),
      "Wait and invalidate",
      {
        verbosity: "always",
        formatLogs: true,
      }
    ).to.be.fulfilled;

    const checkRecipientTokenAccount = await new splToken.Token(
      provider.connection,
      mintId,
      TOKEN_PROGRAM_ID,
      web3.Keypair.generate()
    ).getAccountInfo(await findAta(mintId, provider.wallet.publicKey));
    expect(checkRecipientTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkRecipientTokenAccount.isFrozen).to.eq(false);
  });

  it("Invalidate entry", async () => {
    const nameEntry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName
    );
    const namespaceDataBefore = await getNamespaceByName(
      provider.connection,
      namespaceName
    );

    const transaction = new web3.Transaction();
    await withInvalidateTransferableReverseEntry(
      transaction,
      provider.connection,
      new SignerWallet(invalidator),
      {
        namespaceName,
        entryName,
        mintId: nameEntry.parsed.mint,
        reverseEntryId: nameEntry.parsed.reverseEntry!,
      }
    );

    await withInvalidateTransferableNameEntry(
      transaction,
      provider.connection,
      new SignerWallet(invalidator),
      {
        namespaceName,
        entryName,
        mintId: nameEntry.parsed.mint,
      }
    );
    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init({
          connection: provider.connection,
          wallet: new SignerWallet(invalidator),
          opts: provider.opts,
        }),
        transaction.instructions
      ),
      "Wait and invalidate",
      {
        verbosity: "always",
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
    expect(nameEntry.parsed.reverseEntry?.toString()).to.eq(
      reverseEntryId.toString()
    );
    const checkReverseEntry = await tryGetAccount(async () =>
      getReverseEntry(
        provider.connection,
        provider.wallet.publicKey,
        (
          await findNamespaceId(namespaceName)
        )[0]
      )
    );
    expect(checkReverseEntry).to.eq(null);

    const entryAfter = await tryGetAccount(() =>
      getNameEntry(provider.connection, namespaceName, entryName)
    );
    expect(entryAfter?.parsed.isClaimed).to.be.false;
    expect(entryAfter?.parsed.data).to.be.null;

    const checkNamespaceTokenAccount = await new splToken.Token(
      provider.connection,
      nameEntry.parsed.mint,
      TOKEN_PROGRAM_ID,
      web3.Keypair.generate()
    ).getAccountInfo(
      await findAta(
        nameEntry.parsed.mint,
        (
          await findNamespaceId(namespaceName)
        )[0],
        true
      )
    );
    expect(checkNamespaceTokenAccount.amount.toNumber()).to.eq(0);

    const checkRecipientTokenAccount = await new splToken.Token(
      provider.connection,
      nameEntry.parsed.mint,
      TOKEN_PROGRAM_ID,
      web3.Keypair.generate()
    ).getAccountInfo(
      await findAta(nameEntry.parsed.mint, provider.wallet.publicKey)
    );
    expect(checkRecipientTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkRecipientTokenAccount.isFrozen).to.eq(false);
  });
});
