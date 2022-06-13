import { utils } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

import {
  CLAIM_REQUEST_SEED,
  ENTRY_SEED,
  GLOBAL_CONTEXT_SEED,
  NAMESPACE_SEED,
  NAMESPACES_PROGRAM_ID,
  REVERSE_ENTRY_SEED,
} from "./constants";

/**
 * Finds the namespace id.
 * @returns
 */
export const findNamespaceId = async (
  namespaceName: string
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [
      utils.bytes.utf8.encode(NAMESPACE_SEED),
      utils.bytes.utf8.encode(namespaceName),
    ],
    NAMESPACES_PROGRAM_ID
  );
};

/**
 * Finds the entry id in a given namespace.
 * @returns
 */
export const findNameEntryId = async (
  namespaceId: PublicKey,
  entryName: string
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [
      utils.bytes.utf8.encode(ENTRY_SEED),
      namespaceId.toBytes(),
      utils.bytes.utf8.encode(entryName),
    ],
    NAMESPACES_PROGRAM_ID
  );
};

/**
 * Finds the claim request ID for a given namespace and name.
 * @returns
 */
export const findClaimRequestId = async (
  namespaceId: PublicKey,
  entryName: string,
  requestor: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [
      utils.bytes.utf8.encode(CLAIM_REQUEST_SEED),
      namespaceId.toBytes(),
      utils.bytes.utf8.encode(entryName),
      requestor.toBytes(),
    ],
    NAMESPACES_PROGRAM_ID
  );
};

/**
 * @Deprecated
 * Finds the deprecated reverse entry ID for a given publickey.
 * @returns
 */
export const findDeprecatedReverseEntryId = async (
  pubkey: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [utils.bytes.utf8.encode(REVERSE_ENTRY_SEED), pubkey.toBytes()],
    NAMESPACES_PROGRAM_ID
  );
};

/**
 * Finds the reverse entry ID for a given publickey.
 * @returns
 */
export const findReverseEntryId = async (
  namespace: PublicKey,
  pubkey: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [
      utils.bytes.utf8.encode(REVERSE_ENTRY_SEED),
      namespace.toBuffer(),
      pubkey.toBytes(),
    ],
    NAMESPACES_PROGRAM_ID
  );
};

/**
 * Finds the namespace id.
 * @returns
 */
export const findGlobalContextId = async (): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [utils.bytes.utf8.encode(GLOBAL_CONTEXT_SEED)],
    NAMESPACES_PROGRAM_ID
  );
};
