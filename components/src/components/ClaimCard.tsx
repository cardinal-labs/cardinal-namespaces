import { NameEntryClaim } from "./NameEntryClaim";
import styled from "@emotion/styled";
import { Connection } from "@solana/web3.js";
import { Wallet } from "@saberhq/solana-contrib";

export type ClaimCardProps = {
  dev?: boolean;
  cluster?: string;
  connection: Connection | null;
  wallet: Wallet | null;
  appName?: string;
  appTwitter?: string;
  notify?: Function;
  onComplete?: (asrg0: string) => void;
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
