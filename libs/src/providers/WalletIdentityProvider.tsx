import type { Wallet } from "@saberhq/solana-contrib";
import type { Connection } from "@solana/web3.js";
import React, { useContext, useState } from "react";

import { ClaimCard } from "..";
import { Modal } from "../modal";
import { withSleep } from "../utils/transactions";

export interface WalletIdentity {
  show: (
    wallet: Wallet,
    connection: Connection,
    cluster: string,
    dev?: boolean
  ) => void;
  handle: string | undefined;
  showIdentityModal: boolean;
}

export const WalletIdentityContext = React.createContext<WalletIdentity | null>(
  null
);

interface Props {
  appName?: string;
  appTwitter?: string;
  children: React.ReactNode;
}

export const WalletIdentityProvider: React.FC<Props> = ({
  appName,
  appTwitter,
  children,
}: Props) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [cluster, setCluster] = useState<string | undefined>(undefined);
  const [dev, setDev] = useState<boolean | undefined>(undefined);
  const [showIdentityModal, setShowIdentityModal] = useState<boolean>(false);
  const [handle, setHandle] = useState<string | undefined>(undefined);

  return (
    <WalletIdentityContext.Provider
      value={{
        show: (wallet, connection, cluster, dev) => {
          setWallet(wallet);
          setConnection(connection);
          setCluster(cluster);
          setDev(dev);
          setShowIdentityModal(true);
        },
        handle,
        showIdentityModal,
      }}
    >
      <Modal
        isOpen={showIdentityModal}
        onDismiss={() => setShowIdentityModal(false)}
        darkenOverlay={true}
      >
        <ClaimCard
          dev={dev}
          cluster={cluster}
          wallet={wallet}
          connection={connection}
          appName={appName}
          appTwitter={appTwitter}
          onComplete={(handle: string) => {
            setHandle(handle);
            withSleep(() => {
              setShowIdentityModal(false);
            }, 1000);
          }}
        />
      </Modal>
      {children}
    </WalletIdentityContext.Provider>
  );
};

export const useWalletIdentity = (): WalletIdentity => {
  const identity = useContext(WalletIdentityContext);
  if (!identity) {
    throw new Error("Not in WalletIdentity context");
  }
  return identity;
};
