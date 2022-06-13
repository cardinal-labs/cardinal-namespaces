import {
  findAta,
  withFindOrInitAssociatedTokenAccount,
} from "@cardinal/common";
import { PAYMENT_MANAGER_ADDRESS } from "@cardinal/token-manager/dist/cjs/programs/paymentManager";
import { findPaymentManagerAddress } from "@cardinal/token-manager/dist/cjs/programs/paymentManager/pda";
import { TIME_INVALIDATOR_ADDRESS } from "@cardinal/token-manager/dist/cjs/programs/timeInvalidator";
import { findTimeInvalidatorAddress } from "@cardinal/token-manager/dist/cjs/programs/timeInvalidator/pda";
import { utils } from "@project-serum/anchor";
import type { AccountMeta, Connection, Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import { getNamespace, getReverseEntry } from "./accounts";
import {
  CLAIM_REQUEST_SEED,
  ENTRY_SEED,
  NAMESPACE_SEED,
  NAMESPACES_PROGRAM_ID,
  REVERSE_ENTRY_SEED,
} from "./constants";

export function formatName(namespace: string, name: string): string {
  return namespace === "twitter" ? `@${name}` : `${name}.${namespace}`;
}

export function breakName(fullName: string): [string, string] {
  if (fullName.startsWith("@")) {
    return ["twitter", fullName.split("@")[1]!];
  }
  const [entryName, namespace] = fullName.split(".");
  return [namespace!, entryName!];
}

/**
 * shorten the checksummed version of the input address to have 4 characters at start and end
 * @param address
 * @param chars
 * @returns
 */
export function shortenAddress(address: string, chars = 5): string {
  return `${address.substring(0, chars)}...${address.substring(
    address.length - chars
  )}`;
}

export function displayAddress(address: string, shorten = true): string {
  return shorten ? shortenAddress(address) : address;
}

export async function tryGetName(
  connection: Connection,
  pubkey: PublicKey
): Promise<string | undefined> {
  try {
    const reverseEntry = await getReverseEntry(connection, pubkey);
    return formatName(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      reverseEntry.parsed.namespaceName,
      reverseEntry.parsed.entryName
    );
  } catch (e) {
    console.log(e);
  }
  return undefined;
}

export async function nameForDisplay(
  connection: Connection,
  pubkey: PublicKey
): Promise<string> {
  const name = await tryGetName(connection, pubkey);
  return name || displayAddress(pubkey.toString());
}

export async function claimRequestId(
  namespaceName: string,
  entryName: string,
  user: PublicKey
) {
  const [namespaceId] = await PublicKey.findProgramAddress(
    [
      utils.bytes.utf8.encode(NAMESPACE_SEED),
      utils.bytes.utf8.encode(namespaceName),
    ],
    NAMESPACES_PROGRAM_ID
  );
  return PublicKey.findProgramAddress(
    [
      utils.bytes.utf8.encode(CLAIM_REQUEST_SEED),
      namespaceId.toBytes(),
      utils.bytes.utf8.encode(entryName),
      user.toBytes(),
    ],
    NAMESPACES_PROGRAM_ID
  );
}

export async function nameEntryId(namespaceName: string, entryName: string) {
  const [namespaceId] = await PublicKey.findProgramAddress(
    [
      utils.bytes.utf8.encode(NAMESPACE_SEED),
      utils.bytes.utf8.encode(namespaceName),
    ],
    NAMESPACES_PROGRAM_ID
  );
  return PublicKey.findProgramAddress(
    [
      utils.bytes.utf8.encode(ENTRY_SEED),
      namespaceId.toBytes(),
      utils.bytes.utf8.encode(entryName),
    ],
    NAMESPACES_PROGRAM_ID
  );
}

export const reverseEntryId = (address: PublicKey) => {
  return PublicKey.findProgramAddress(
    [utils.bytes.utf8.encode(REVERSE_ENTRY_SEED), address.toBytes()],
    NAMESPACES_PROGRAM_ID
  );
};

export const withRemainingAccountsForClaim = async (
  connection: Connection,
  transaction: Transaction,
  payer: PublicKey,
  namespaceId: PublicKey,
  tokenManagerId: PublicKey,
  duration: number
): Promise<AccountMeta[]> => {
  const namespace = await getNamespace(connection, namespaceId);
  if (namespace.parsed.paymentAmountDaily.gt(0)) {
    const [paymentManagerId] = await findPaymentManagerAddress("cardinal");
    const [timeInvalidatorId] = await findTimeInvalidatorAddress(
      tokenManagerId
    );
    const accounts = [
      {
        pubkey: namespace.parsed.paymentMint,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: paymentManagerId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: timeInvalidatorId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: TIME_INVALIDATOR_ADDRESS,
        isSigner: false,
        isWritable: false,
      },
    ];
    if (duration > 1) {
      const payerTokenAccountId = await findAta(
        namespace.parsed.paymentMint,
        payer
      );
      const paymentTokenAccount = await withFindOrInitAssociatedTokenAccount(
        transaction,
        connection,
        namespace.parsed.paymentMint,
        payer,
        payer,
        true
      );
      const feeCollectorId = await withFindOrInitAssociatedTokenAccount(
        transaction,
        connection,
        namespace.parsed.paymentMint,
        paymentManagerId,
        payer,
        true
      );
      accounts.concat([
        {
          pubkey: payerTokenAccountId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: paymentTokenAccount,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: feeCollectorId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: PAYMENT_MANAGER_ADDRESS,
          isSigner: false,
          isWritable: false,
        },
      ]);
    }
    return accounts;
  } else {
    return [];
  }
};
