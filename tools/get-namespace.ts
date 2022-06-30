import { getNamespaceByName } from "../src";
import { connectionFor } from "./connection";

export const getNamespaceData = async (
  namespaceName: string,
  clusterName: string
) => {
  const connection = connectionFor(clusterName);
  const namespace = await getNamespaceByName(connection, namespaceName);
  console.log(namespace);
};

getNamespaceData("EmpireDAO", "mainnet-beta")
  .then(() => {
    console.log("success");
  })
  .catch((e) => {
    console.log("Error:", e);
  });
