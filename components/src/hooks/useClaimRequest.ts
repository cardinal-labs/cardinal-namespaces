import { ClaimRequestData, getClaimRequest } from "@cardinal/namespaces";
import { Connection, PublicKey } from "@solana/web3.js";
import { useMemo, useState } from "react";
import { AccountData } from "@cardinal/certificates";

export const useClaimRequest = (
  connection: Connection | null,
  namespaceName: string,
  entryName: string | undefined,
  pubkey: PublicKey | undefined
) => {
  const [loadingClaimRequest, setLoadingClaimRequest] = useState<
    boolean | undefined
  >(undefined);
  const [claimRequest, setClaimRequest] = useState<
    AccountData<ClaimRequestData> | undefined
  >(undefined);

  const getClaimRequestData = async () => {
    setLoadingClaimRequest(true);
    try {
      if (!pubkey || !entryName || !connection) return;
      const data = await getClaimRequest(
        connection,
        namespaceName,
        entryName,
        pubkey
      );
      setClaimRequest(data);
    } catch (e) {
      setClaimRequest(undefined);
      console.log(`Failed to get claim request: ${e}`, e);
    } finally {
      setLoadingClaimRequest(false);
    }
  };

  useMemo(async () => {
    getClaimRequestData();
  }, [connection, namespaceName, entryName, pubkey]);

  return {
    claimRequest,
    loadingClaimRequest,
    getClaimRequestData,
  };
};
