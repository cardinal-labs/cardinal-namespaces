import type {
  AccountData,
  ClaimRequestData,
  EntryData,
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
  programAccounts.forEach((account) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const entryData = coder.accounts.decode("entry", account.account.data);
      namespaceEntries.push({
        ...account,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        parsed: entryData,
      });
    } catch (e) {
      console.log(e);
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const claimRequestData = coder.accounts.decode(
        "claimRequest",
        account.account.data
      );
      claimRequests.push({
        ...account,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        parsed: claimRequestData,
      });
    } catch (e) {
      console.log(e);
    }
  });
  console.log(
    `Found (${namespaceEntries.length}) name entries and (${claimRequests.length}) claim requests`
  );
}

countEntries(connectionFor("mainnet")).catch((e) => console.log(e));
