import { certificateIdForMint } from "@cardinal/certificates";
import * as anchor from "@project-serum/anchor";
import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import assert from "assert";

import {
  findNamespaceId,
  getClaimRequest,
  getNameEntry,
  getNamespaceByName,
  getReverseEntry,
  withCreateClaimRequest,
  withCreateNamespace,
  withUpdateClaimRequest,
} from "../../src";
import {
  withClaimEntry,
  withInitEntry,
  withSetReverseEntry,
} from "../../src/deprecated";
import { createMint, withFindOrInitAssociatedTokenAccount } from "../utils";
import { getProvider } from "../workspace";

describe("namespace-create-rent", () => {
  const provider = getProvider();

  // test params
  const namespaceName = `ns-${Math.random()}`;
  const entryName = "testname";
  const mintAuthority = web3.Keypair.generate();
  const paymentAmountDaily = new anchor.BN(864000);
  const rentDuration = 500;
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
      new anchor.BN(86400),
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

    const checkNamespace = await getNamespaceByName(
      provider.connection,
      namespaceName
    );
    assert.equal(checkNamespace.parsed.name, namespaceName);
    assert.equal(checkNamespace.parsed.maxRentalSeconds, 86400);
    assert.equal(
      checkNamespace.parsed.paymentAmountDaily.toNumber(),
      paymentAmountDaily.toNumber()
    );
  });

  it("Initialize entry", async () => {
    const certificateMint = web3.Keypair.generate();
    const transaction = new web3.Transaction();

    await withInitEntry(
      provider.connection,
      provider.wallet,
      certificateMint.publicKey,
      namespaceName,
      entryName,
      transaction
    );
    transaction.feePayer = provider.wallet.publicKey;
    transaction.recentBlockhash = (
      await provider.connection.getRecentBlockhash("max")
    ).blockhash;
    await provider.wallet.signTransaction(transaction);
    transaction.partialSign(certificateMint);
    await web3.sendAndConfirmRawTransaction(
      provider.connection,
      transaction.serialize()
    );

    const checkEntry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName
    );
    assert.equal(checkEntry.parsed.name, entryName);
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

    transaction.feePayer = provider.wallet.publicKey;
    transaction.recentBlockhash = (
      await provider.connection.getRecentBlockhash("max")
    ).blockhash;
    await provider.wallet.signTransaction(transaction);
    await web3.sendAndConfirmRawTransaction(
      provider.connection,
      transaction.serialize()
    );
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
    transaction.feePayer = provider.wallet.publicKey;
    transaction.recentBlockhash = (
      await provider.connection.getRecentBlockhash("max")
    ).blockhash;
    await provider.wallet.signTransaction(transaction);
    await web3.sendAndConfirmRawTransaction(
      provider.connection,
      transaction.serialize()
    );
  });

  it("Claim", async () => {
    const entry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName
    );
    const certificateMintId = entry.parsed.mint;

    const transaction = new web3.Transaction();
    const userPaymentTokenAccountId =
      await withFindOrInitAssociatedTokenAccount(
        transaction,
        provider.connection,
        paymentMint.publicKey,
        provider.wallet.publicKey,
        provider.wallet.publicKey
      );

    const userPaymentTokenAccountBefore = await paymentMint.getAccountInfo(
      userPaymentTokenAccountId
    );

    await withClaimEntry(
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName,
      certificateMintId,
      500,
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
      certificateMintId.toString()
    );

    const [certificateId] = await certificateIdForMint(certificateMintId);

    const certificatePaymentTokenAccountId =
      await splToken.Token.getAssociatedTokenAddress(
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        splToken.TOKEN_PROGRAM_ID,
        paymentMint.publicKey,
        certificateId,
        true
      );

    const checkCertificatePaymentTokenAccount =
      await paymentMint.getAccountInfo(certificatePaymentTokenAccountId);

    const expectedPayment =
      rentDuration * (paymentAmountDaily.toNumber() / (60 * 60 * 24));
    assert(
      checkCertificatePaymentTokenAccount.amount.eq(
        new anchor.BN(expectedPayment)
      )
    );

    const userPaymentTokenAccountAfter = await paymentMint.getAccountInfo(
      userPaymentTokenAccountId
    );
    assert(
      userPaymentTokenAccountBefore.amount
        .sub(userPaymentTokenAccountAfter.amount)
        .eq(new anchor.BN(expectedPayment))
    );
  });

  it("Set reverse entry", async () => {
    const entry = await getNameEntry(
      provider.connection,
      namespaceName,
      entryName
    );
    const certificateMintId = entry.parsed.mint;

    const transaction = new web3.Transaction();
    await withSetReverseEntry(
      provider.connection,
      provider.wallet,
      namespaceName,
      entryName,
      certificateMintId,
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
