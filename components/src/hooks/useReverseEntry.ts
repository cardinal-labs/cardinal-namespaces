import { getReverseEntry, ReverseEntryData } from "@cardinal/namespaces";
import { Connection, PublicKey } from "@solana/web3.js";
import { useMemo, useState } from "react";
import { AccountData } from "@cardinal/certificates";

export const useReverseEntry = (
  connection: Connection | null,
  pubkey: PublicKey | undefined
) => {
  const [loading, setLoading] = useState<boolean | undefined>(undefined);
  const [reverseEntryData, setReverseEntry] = useState<
    AccountData<ReverseEntryData> | undefined
  >(undefined);

  const getReverseEntryData = async () => {
    setLoading(true);
    try {
      if (!pubkey || !connection) return;
      const data = await getReverseEntry(connection, pubkey);
      setReverseEntry(data);
    } catch (e) {
      setReverseEntry(undefined);
      console.log(`Failed to get claim request: ${e}`, e);
    } finally {
      setLoading(false);
    }
  };

  useMemo(async () => {
    getReverseEntryData();
  }, [connection, pubkey]);

  return {
    reverseEntryData,
    getReverseEntryData,
    loading,
  };
};
