import { tryGetName } from "@cardinal/namespaces";
import { useWalletIdentity } from "../providers/WalletIdentityProvider";
import type { PublicKey, Connection } from "@solana/web3.js";
import { useMemo, useState } from "react";

export const useAddressName = (
  connection: Connection,
  address: PublicKey | undefined
): { displayName: string | undefined; loadingName: boolean } => {
  const { handle } = useWalletIdentity();
  const [displayName, setDisplayName] = useState<string | undefined>();
  const [loadingName, setLoadingName] = useState<boolean>(true);

  const refreshName = async () => {
    try {
      setLoadingName(true);
      if (address) {
        const n = await tryGetName(connection, address);
        setDisplayName(n);
      }
    } finally {
      setLoadingName(false);
    }
  };

  useMemo(() => {
    void refreshName();
  }, [connection, address, handle]);

  return { displayName, loadingName };
};
