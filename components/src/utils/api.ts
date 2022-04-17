import * as web3 from "@solana/web3.js";
import * as namespaces from "@cardinal/namespaces";
import * as certificates from "@cardinal/certificates";
import * as splToken from "@solana/spl-token";
import * as BufferLayout from "@solana/buffer-layout";
import { Wallet } from "@saberhq/solana-contrib";
import { withFindOrInitAssociatedTokenAccount } from "@cardinal/certificates";
import { AccountData, EntryData } from "@cardinal/namespaces";
import { signAndSendTransaction } from "./transactions";

export function apiBase(dev?: boolean): string {
  return `https://${dev ? "dev-api" : "api"}.cardinal.so`;
}

export async function tryGetNameEntry(
  connection: web3.Connection,
  namespaceName: string,
  entryName: string
): Promise<AccountData<EntryData> | null> {
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

export async function revokeAndClaim(
  cluster: string,
  connection: web3.Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  duration: number | null,
  reverseEntryId: web3.PublicKey,
  claimRequestId: web3.PublicKey,
  certificateMintId: web3.PublicKey,
  certificateOwnerId: web3.PublicKey
): Promise<string> {
  const entry = await tryGetNameEntry(connection, namespaceName, entryName);
  const transaction = new web3.Transaction();
  if (!entry?.parsed.reverseEntry) {
    await namespaces.withRevokeReverseEntry(
      connection,
      wallet,
      namespaceName,
      entryName,
      reverseEntryId,
      claimRequestId,
      transaction
    );
  }
  await namespaces.withRevokeEntry(
    connection,
    wallet,
    namespaceName,
    entryName,
    certificateMintId,
    certificateOwnerId,
    claimRequestId,
    transaction
  );
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;
  await wallet.signTransaction(transaction);
  const txid = await web3.sendAndConfirmRawTransaction(
    connection,
    transaction.serialize()
  );

  const transaction2 = new web3.Transaction();
  await namespaces.withClaimEntry(
    connection,
    wallet,
    namespaceName,
    entryName,
    certificateMintId,
    duration || 0,
    transaction2
  );
  await namespaces.withSetReverseEntry(
    connection,
    wallet,
    namespaceName,
    entryName,
    certificateMintId,
    transaction2
  );
  transaction2.feePayer = wallet.publicKey;
  transaction2.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;
  await wallet.signTransaction(transaction2);
  return web3.sendAndConfirmRawTransaction(
    connection,
    transaction2.serialize()
  );
}

export async function setReverseEntry(
  connection: web3.Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  certificateMintId: web3.PublicKey
): Promise<string> {
  const transaction = await namespaces.withSetReverseEntry(
    connection,
    wallet,
    namespaceName,
    entryName,
    certificateMintId,
    new web3.Transaction()
  );
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;
  await wallet.signTransaction(transaction);
  let txid = null;
  txid = await web3.sendAndConfirmRawTransaction(
    connection,
    transaction.serialize()
  );
  return txid;
}

export async function initAndClaimEntry(
  cluster: string,
  connection: web3.Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  duration: number | null
): Promise<string> {
  const certificateMint = web3.Keypair.generate();
  const transaction = new web3.Transaction();
  await namespaces.withInitEntry(
    connection,
    wallet,
    certificateMint.publicKey,
    namespaceName,
    entryName,
    transaction
  );
  await namespaces.withClaimEntry(
    connection,
    wallet,
    namespaceName,
    entryName,
    certificateMint.publicKey,
    duration || 0,
    transaction
  );
  await namespaces.withSetReverseEntry(
    connection,
    wallet,
    namespaceName,
    entryName,
    certificateMint.publicKey,
    transaction
  );
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;
  await wallet.signTransaction(transaction);
  await transaction.partialSign(certificateMint);
  return web3.sendAndConfirmRawTransaction(connection, transaction.serialize());
}

export async function claimEntry(
  connection: web3.Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  certificateMintId: web3.PublicKey,
  duration: number | null
): Promise<string> {
  const transaction = await namespaces.withClaimEntry(
    connection,
    wallet,
    namespaceName,
    entryName,
    certificateMintId,
    duration || 0,
    new web3.Transaction()
  );
  await namespaces.withSetReverseEntry(
    connection,
    wallet,
    namespaceName,
    entryName,
    certificateMintId,
    transaction
  );
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;
  await wallet.signTransaction(transaction);
  let txid = null;
  txid = await web3.sendAndConfirmRawTransaction(
    connection,
    transaction.serialize()
  );
  return txid;
}

export async function setEntryData(
  connection: web3.Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string,
  entryData: string
): Promise<string> {
  const transaction = await namespaces.withSetEntryData(
    connection,
    wallet,
    namespaceName,
    entryName,
    new web3.PublicKey(entryData),
    new web3.Transaction()
  );
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;
  await wallet.signTransaction(transaction);
  let txid = null;
  txid = await web3.sendAndConfirmRawTransaction(
    connection,
    transaction.serialize()
  );
  return txid;
}

export async function approveClaimRequest(
  connection: web3.Connection,
  wallet: Wallet,
  namespaceName: string,
  claimRequestId: web3.PublicKey
): Promise<string> {
  const transaction = await namespaces.withUpdateClaimRequest(
    connection,
    wallet,
    namespaceName,
    claimRequestId,
    true,
    new web3.Transaction()
  );
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;
  await wallet.signTransaction(transaction);
  let txid = null;
  txid = await web3.sendAndConfirmRawTransaction(
    connection,
    transaction.serialize()
  );
  return txid;
}

export async function getPendingClaimRequests(connection: web3.Connection) {
  return namespaces.getPendingClaimRequests(connection);
}

export async function createClaimRequest(
  connection: web3.Connection,
  wallet: Wallet,
  namespaceName: string,
  entryName: string
): Promise<string> {
  return await signAndSendTransaction(
    connection,
    wallet,
    await namespaces.withCreateClaimRequest(
      connection,
      wallet,
      namespaceName,
      entryName,
      wallet.publicKey,
      new web3.Transaction()
    )
  );
}

export async function wrapSol(
  connection: web3.Connection,
  wallet: Wallet,
  lamports: number
): Promise<string> {
  console.log(`Wrapping ${lamports} lamports`);
  const transaction = new web3.Transaction();
  const nativeAssociatedTokenAccountId =
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      connection,
      splToken.NATIVE_MINT,
      wallet.publicKey,
      wallet.publicKey
    );
  transaction.add(
    web3.SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: nativeAssociatedTokenAccountId,
      lamports,
    })
  );
  transaction.add(createSyncNativeInstruction(nativeAssociatedTokenAccountId));
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;
  await wallet.signTransaction(transaction);
  return await web3.sendAndConfirmRawTransaction(
    connection,
    transaction.serialize()
  );
}

export function createSyncNativeInstruction(
  nativeAccount: web3.PublicKey
): web3.TransactionInstruction {
  // @ts-ignore
  const dataLayout = BufferLayout.struct([BufferLayout.u8("instruction")]);
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 17, // SyncNative instruction
    },
    data
  );

  let keys = [{ pubkey: nativeAccount, isSigner: false, isWritable: true }];
  return new web3.TransactionInstruction({
    keys,
    programId: splToken.TOKEN_PROGRAM_ID,
    data,
  });
}

const GOOGLE_API_KEYS = [
  "AIzaSyDkw2sqop26epnX1uH474xqNJPQZR0wjcU",
  "AIzaSyD8TYEdz-8g8-4baaIwvuMUXlI8C_d3UOM",
  "AIzaSyAMQw50YDTi0nFst-WVx4m5ynK0HOe--Gc",
  "AIzaSyDZkfN-v-tppKZa-AbVLN8vFcny0fE_b84",
];

export async function searchName(
  connection: web3.Connection,
  namespaceName: string,
  entryName: string
) {
  let searchNames: string[] = [];
  for (let i = 0; i < GOOGLE_API_KEYS.length; i++) {
    try {
      if (!(searchNames.length > 0)) {
        const result = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEYS[i]}&cx=93585a1fc79535d75&q=${entryName}`
        );
        const json = await result.json();
        searchNames = json.items.map((item: any) => {
          const match = item?.title?.match(/\(@(.*)\)/);
          return match ? match[1] : null;
        });
      }
    } catch (e) {
      console.log(`Error fetching google names: ${e}`);
    }
  }
  const filteredNames = [
    entryName,
    ...Array.from(
      new Set(searchNames.filter((n) => n !== entryName && n != null))
    ),
  ];
  const nameEntries = await namespaces.getNameEntries(
    connection,
    namespaceName,
    filteredNames
  );
  console.log(nameEntries);

  const mintIds = nameEntries
    .map((nameEntry) => nameEntry?.parsed?.mint)
    .filter((mintId) => mintId);
  const certificateIdsTuple = await Promise.all(
    mintIds.map((mintId) => certificates.certificateIdForMint(mintId))
  );
  const certificateIds = certificateIdsTuple.map((tup) => tup[0]);
  const certificateDatas = await certificates.getCertificates(
    connection,
    certificateIds
  );
  const mintStringToCertificate = certificateDatas.reduce(
    (acc: { [key: string]: any }, certificateData) => {
      if (certificateData.parsed?.mint) {
        acc[certificateData.parsed?.mint.toString()] = certificateData;
      }
      return acc;
    },
    {}
  );
  const results = [];
  for (let i = 0; i < nameEntries.length; i++) {
    results.push({
      nameEntry: nameEntries[i],
      certificate:
        mintStringToCertificate[nameEntries[i]?.parsed?.mint?.toString() || ""],
    });
  }
  return results;
}
