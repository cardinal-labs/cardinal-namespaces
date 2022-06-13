import type { AccountData } from "@cardinal/common";
import {
  AnchorProvider,
  BorshAccountsCoder,
  Program,
  utils,
} from "@project-serum/anchor";
import type { Connection, PublicKey } from "@solana/web3.js";

import type {
  ClaimRequestData,
  EntryData,
  NamespaceData,
  ReverseEntryData,
} from ".";
import { NAMESPACES_IDL, NAMESPACES_PROGRAM_ID } from ".";
import type { NAMESPACES_PROGRAM } from "./constants";
import {
  findClaimRequestId,
  findDeprecatedReverseEntryId,
  findGlobalContextId,
  findNameEntryId,
  findNamespaceId,
  findReverseEntryId,
} from "./pda";

export async function getNamespaceByName(
  connection: Connection,
  namespaceName: string
): Promise<AccountData<NamespaceData>> {
  const [namespaceId] = await findNamespaceId(namespaceName);
  return getNamespace(connection, namespaceId);
}

export async function getNamespace(
  connection: Connection,
  namespaceId: PublicKey
): Promise<AccountData<NamespaceData>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const provider = new AnchorProvider(connection, null, {});
  const namespacesProgram = new Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const parsed = await namespacesProgram.account.namespace.fetch(namespaceId);
  return {
    parsed,
    pubkey: namespaceId,
  };
}

export async function getGlobalContext(
  connection: Connection
): Promise<AccountData<NamespaceData>> {
  const [globalContextId] = await findGlobalContextId();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const provider = new AnchorProvider(connection, null, {});
  const namespacesProgram = new Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const parsed = await namespacesProgram.account.globalContext.fetch(
    globalContextId
  );
  return {
    parsed,
    pubkey: globalContextId,
  };
}

export async function getAllNamespaces(
  connection: Connection
): Promise<AccountData<NamespaceData>[]> {
  const programAccounts = await connection.getProgramAccounts(
    NAMESPACES_PROGRAM_ID,
    {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: utils.bytes.bs58.encode(
              BorshAccountsCoder.accountDiscriminator("namespace")
            ),
          },
        },
      ],
    }
  );
  const namespaces: AccountData<NamespaceData>[] = [];
  const coder = new BorshAccountsCoder(NAMESPACES_IDL);
  programAccounts.forEach((account) => {
    try {
      const namespace: NamespaceData = coder.decode(
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
  connection: Connection,
  namespaceName: string,
  entryName: string
): Promise<AccountData<EntryData>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const provider = new AnchorProvider(connection, null, {});
  const namespacesProgram = new Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(namespaceName);
  const [entryId] = await findNameEntryId(namespaceId, entryName);
  const parsed = await namespacesProgram.account.entry.fetch(entryId);
  return {
    parsed,
    pubkey: entryId,
  };
}

export async function getNameEntriesForNamespace(
  connection: Connection,
  namespaceName: string,
  entryNames: string[]
): Promise<(AccountData<EntryData> & { name: string })[]> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const provider = new AnchorProvider(connection, null, {});
  const namespacesProgram = new Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(namespaceName);
  const entryTuples = await Promise.all(
    entryNames.map((entryName) => findNameEntryId(namespaceId, entryName))
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
  connection: Connection,
  namespaceName: string,
  entryName: string,
  requestor: PublicKey
): Promise<AccountData<ClaimRequestData>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const provider = new AnchorProvider(connection, null, {});
  const namespacesProgram = new Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const [namespaceId] = await findNamespaceId(namespaceName);
  const [claimRequestId] = await findClaimRequestId(
    namespaceId,
    entryName,
    requestor
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
  connection: Connection
): Promise<AccountData<ClaimRequestData>[]> {
  const programAccounts = await connection.getProgramAccounts(
    NAMESPACES_PROGRAM_ID,
    {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: utils.bytes.bs58.encode(
              BorshAccountsCoder.accountDiscriminator("claimRequest")
            ),
          },
        },
      ],
    }
  );
  const pendingClaimRequests: AccountData<ClaimRequestData>[] = [];
  const coder = new BorshAccountsCoder(NAMESPACES_IDL);
  programAccounts.forEach((account) => {
    try {
      const claimRequest: ClaimRequestData = coder.decode(
        "claimRequest",
        account.account.data
      );
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
  connection: Connection,
  namespace: PublicKey,
  pubkey: PublicKey
): Promise<AccountData<ReverseEntryData>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const provider = new AnchorProvider(connection, null, {});
  const namespacesProgram = new Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  try {
    if (!namespace) {
      throw new Error("Skipping to deprecated version");
    }
    const [reverseEntryId] = await findReverseEntryId(namespace, pubkey);
    const parsed = await namespacesProgram.account.reverseEntry.fetch(
      reverseEntryId
    );
    return {
      parsed,
      pubkey: reverseEntryId,
    };
  } catch (e) {
    const [reverseEntryId] = await findDeprecatedReverseEntryId(pubkey);
    const parsed = await namespacesProgram.account.reverseEntry.fetch(
      reverseEntryId
    );
    return {
      parsed,
      pubkey: reverseEntryId,
    };
  }
}

export async function tryGetReverseEntry(
  connection: Connection,
  pubkey: PublicKey,
  namespace: PublicKey
): Promise<AccountData<ReverseEntryData> | null> {
  try {
    return await getReverseEntry(connection, pubkey, namespace);
  } catch (e) {
    console.log(`Failed to get reverse entry`);
    return null;
  }
}
