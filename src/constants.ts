import type { AnchorTypes } from "@saberhq/anchor-contrib";
import { PublicKey } from "@solana/web3.js";

import * as NAMESPACES_TYPES from "./idl/cardinal_namespaces";

export const NAMESPACES_PROGRAM_ID = new PublicKey(
  "nameXpT2PwZ2iA6DTNYTotTmiMYusBCYqwBLN2QgF4w"
);

export const METADATA_CONFIG_SEED = "metadata-config";

export type NAMESPACES_PROGRAM = NAMESPACES_TYPES.Namespaces;

export const NAMESPACES_IDL = NAMESPACES_TYPES.IDL;

export type NamespacesTypes = AnchorTypes<NAMESPACES_PROGRAM>;

type Accounts = NamespacesTypes["Accounts"];

export type GlobalContextData = Accounts["globalContext"];

export type NamespaceData = Accounts["namespace"];

export type EntryData = Accounts["entry"];

export type ReverseEntryData = Accounts["reverseEntry"];

export type ClaimRequestData = Accounts["claimRequest"];

export const DEFAULT_PAYMENT_MANAGER = "cardinal";

export const GLOBAL_RENTAL_PERCENTAGE = 0.2;
export const GLOBAL_CONTEXT_SEED = "context";
export const NAMESPACE_SEED = "namespace";
export const ENTRY_SEED = "entry";
export const REVERSE_ENTRY_SEED = "reverse-entry";
export const CLAIM_REQUEST_SEED = "rent-request";
