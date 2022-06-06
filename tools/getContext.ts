import { getGlobalContext } from "../src";
import { connectionFor } from "./connection";

const getContext = async (cluster: string) => {
  const connection = connectionFor(cluster);
  const globalContext = await getGlobalContext(connection);
  console.log(globalContext);
};

getContext("mainnet").catch((e) => console.log(e));
