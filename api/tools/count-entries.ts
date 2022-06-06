import type {
  AccountData,
  ClaimRequestData,
  EntryData,
  ReverseEntryData,
} from "@cardinal/namespaces";
import { NAMESPACES_IDL, NAMESPACES_PROGRAM_ID } from "@cardinal/namespaces";
import * as anchor from "@project-serum/anchor";
import type * as web3 from "@solana/web3.js";

import { connectionFor } from "../common/connection";

export async function countEntries(connection: web3.Connection): Promise<void> {
  const coder = new anchor.BorshCoder(NAMESPACES_IDL);
  const programAccounts = await connection.getProgramAccounts(
    NAMESPACES_PROGRAM_ID
  );
  console.log(`Found ${programAccounts.length} accounts`);
  const namespaceEntries: AccountData<EntryData>[] = [];
  const claimRequests: AccountData<ClaimRequestData>[] = [];
  const reverseEntries: AccountData<ReverseEntryData>[] = [];
  programAccounts.forEach((account) => {
    try {
      const entryData = coder.accounts.decode("entry", account.account.data);
      namespaceEntries.push({
        ...account,
        parsed: entryData,
      });
    } catch (e) {}
    try {
      const claimRequestData = coder.accounts.decode(
        "claimRequest",
        account.account.data
      );
      claimRequests.push({
        ...account,
        parsed: claimRequestData,
      });
    } catch (e) {}

    try {
      const reverseEntryData = coder.accounts.decode(
        "reverseEntry",
        account.account.data
      );
      reverseEntries.push({
        ...account,
        parsed: reverseEntryData,
      });
    } catch (e) {}
  });
  console.log(
    `Found (${namespaceEntries.length}) name entries (${claimRequests.length}) reverse entries and (${claimRequests.length}) claim requests`
  );
}

countEntries(connectionFor("mainnet")).catch((e) => console.log(e));
