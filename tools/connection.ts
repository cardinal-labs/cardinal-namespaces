import { Connection } from "@solana/web3.js";

const networkURLs: { [key: string]: string } = {
  ["mainnet-beta"]:
    "https://solana-api.syndica.io/access-token/Bqlwv84AfB8bCeqXyVLrelIGuwgV8yR0HngGPk4x5ZaUuAIdk02w4ohPeOmV4sM1/rpc",
  mainnet:
    "https://solana-api.syndica.io/access-token/Bqlwv84AfB8bCeqXyVLrelIGuwgV8yR0HngGPk4x5ZaUuAIdk02w4ohPeOmV4sM1/rpc",
  devnet: "https://api.devnet.solana.com/",
  testnet: "https://api.testnet.solana.com/",
  localnet: "http://localhost:8899/",
};

export const connectionFor = (cluster: string, defaultCluster = "mainnet") => {
  return new Connection(
    process.env.RPC_URL || networkURLs[cluster || defaultCluster] || "",
    "recent"
  );
};
