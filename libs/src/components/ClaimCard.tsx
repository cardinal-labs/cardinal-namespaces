import styled from "@emotion/styled";
import type { Wallet } from "@saberhq/solana-contrib";
import type { Connection } from "@solana/web3.js";

import { NameEntryClaim } from "./NameEntryClaim";

export type ClaimCardProps = {
  dev?: boolean;
  cluster?: string;
  connection: Connection | null;
  wallet: Wallet | null;
  appName?: string;
  appTwitter?: string;
  notify?: (arg: { message?: string; txid?: string }) => void;
  onComplete?: (arg: string) => void;
};

export const ClaimCard = ({
  appName,
  appTwitter,
  dev,
  cluster,
  connection,
  wallet,
  notify,
  onComplete,
}: ClaimCardProps) => {
  return (
    <>
      <ClaimCardOuter>
        <NameEntryClaim
          dev={dev}
          cluster={cluster}
          connection={connection}
          wallet={wallet}
          appName={appName}
          appTwitter={appTwitter}
          notify={notify}
          onComplete={onComplete}
        />
      </ClaimCardOuter>
    </>
  );
};

export const ClaimCardOuter = styled.div`
  width 100%;
  height: 100%;
  position: relative;
  margin: 0px auto;
  min-height: 200px;
  padding: 0px 20px;
`;
