/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";

import type {
  AccountData,
  ClaimRequestData,
  EntryData,
  NamespaceData,
  ReverseEntryData,
} from "./types/accounts";
import type { Namespaces } from "./types/idl";
import {
  CLAIM_REQUEST_SEED,
  ENTRY_SEED,
  NAMESPACE_SEED,
  NAMESPACES_IDL,
  NAMESPACES_PROGRAM_ID,
  REVERSE_ENTRY_SEED,
} from "./utils";

export async function getNamespace(
  connection: web3.Connection,
  namespaceName: string
): Promise<AccountData<NamespaceData>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const provider = new anchor.Provider(connection, null, {});
  const namespacesProgram = new anchor.Program<Namespaces>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await web3.PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(namespaceName),
    ],
    namespacesProgram.programId
  );

  const parsed = await namespacesProgram.account.namespace.fetch(namespaceId);
  return {
    parsed,
    pubkey: namespaceId,
  };
}

export async function getNamespaces(
  connection: web3.Connection
): Promise<AccountData<NamespaceData>[]> {
  const coder = new anchor.Coder(NAMESPACES_IDL);
  const programAccounts = await connection.getProgramAccounts(
    NAMESPACES_PROGRAM_ID
  );
  const namespaces: AccountData<NamespaceData>[] = [];
  programAccounts.forEach((account) => {
    try {
      const namespace = coder.accounts.decode(
        "namespace",
        account.account.data
      );
      namespaces.push({
        ...account,
        parsed: namespace,
      });
    } catch (e) {
      console.log(`Failed to decode namespace`);
    }
  });
  return namespaces.sort((a, b) =>
    a.pubkey.toBase58().localeCompare(b.pubkey.toBase58())
  );
}

export async function getNameEntry(
  connection: web3.Connection,
  namespaceName: string,
  entryName: string
): Promise<AccountData<EntryData>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const provider = new anchor.Provider(connection, null, {});
  const namespacesProgram = new anchor.Program<Namespaces>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await web3.PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(namespaceName),
    ],
    namespacesProgram.programId
  );
  const [entryId] = await web3.PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(ENTRY_SEED),
      namespaceId.toBytes(),
      anchor.utils.bytes.utf8.encode(entryName),
    ],
    namespacesProgram.programId
  );
  const parsed = await namespacesProgram.account.entry.fetch(entryId);
  return {
    parsed,
    pubkey: entryId,
  };
}

export async function getNameEntries(
  connection: web3.Connection,
  namespaceName: string,
  entryNames: string[]
): Promise<(AccountData<EntryData> & { name: string })[]> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const provider = new anchor.Provider(connection, null, {});
  const namespacesProgram = new anchor.Program<Namespaces>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await web3.PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(namespaceName),
    ],
    namespacesProgram.programId
  );
  const entryTuples = await Promise.all(
    entryNames.map((entryName) =>
      web3.PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode(ENTRY_SEED),
          namespaceId.toBytes(),
          anchor.utils.bytes.utf8.encode(entryName),
        ],
        namespacesProgram.programId
      )
    )
  );
  const entryIds = entryTuples.map((tuple) => tuple[0]);
  const result = (await namespacesProgram.account.entry.fetchMultiple(
    entryIds
  )) as EntryData[];
  return result.map((parsed: EntryData, i) => ({
    parsed,
    pubkey: entryIds[i]!,
    name: entryNames[i]!,
  }));
}

export async function getClaimRequest(
  connection: web3.Connection,
  namespaceName: string,
  entryName: string,
  requestor: web3.PublicKey
): Promise<AccountData<ClaimRequestData>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const provider = new anchor.Provider(connection, null, {});
  const namespacesProgram = new anchor.Program<Namespaces>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await web3.PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(NAMESPACE_SEED),
      anchor.utils.bytes.utf8.encode(namespaceName),
    ],
    namespacesProgram.programId
  );
  const [claimRequestId] = await web3.PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(CLAIM_REQUEST_SEED),
      namespaceId.toBytes(),
      anchor.utils.bytes.utf8.encode(entryName),
      requestor.toBytes(),
    ],
    namespacesProgram.programId
  );
  const parsed = await namespacesProgram.account.claimRequest.fetch(
    claimRequestId
  );
  return {
    parsed,
    pubkey: claimRequestId,
  };
}

export async function getPendingClaimRequests(
  connection: web3.Connection
): Promise<AccountData<ClaimRequestData>[]> {
  const coder = new anchor.Coder(NAMESPACES_IDL);
  const programAccounts = await connection.getProgramAccounts(
    NAMESPACES_PROGRAM_ID
  );
  const pendingClaimRequests: AccountData<ClaimRequestData>[] = [];
  programAccounts.forEach((account) => {
    try {
      const claimRequest = coder.accounts.decode(
        "claimRequest",
        account.account.data
      ) as ClaimRequestData;
      if (!claimRequest.isApproved) {
        pendingClaimRequests.push({
          ...account,
          parsed: claimRequest,
        });
      }
    } catch (e) {
      console.log(`Failed to decode claim request`);
    }
  });
  return pendingClaimRequests;
}

export async function getReverseEntry(
  connection: web3.Connection,
  pubkey: web3.PublicKey
): Promise<AccountData<ReverseEntryData>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const provider = new anchor.Provider(connection, null, {});
  const namespacesProgram = new anchor.Program<Namespaces>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [reverseEntryId] = await web3.PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode(REVERSE_ENTRY_SEED), pubkey.toBytes()],
    namespacesProgram.programId
  );
  const parsed = await namespacesProgram.account.reverseEntry.fetch(
    reverseEntryId
  );
  return {
    parsed,
    pubkey: reverseEntryId,
  };
}

export async function tryGetReverseEntry(
  connection: web3.Connection,
  pubkey: web3.PublicKey
): Promise<AccountData<ReverseEntryData> | null> {
  try {
    return await getReverseEntry(connection, pubkey);
  } catch (e) {
    console.log(`Failed to get reverse entry`);
    return null;
  }
}
