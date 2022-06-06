import { getNameEntry } from "../src";
import { connectionFor } from "./connection";

const getNameEntryData = async (cluster: string) => {
  const connection = connectionFor(cluster);
  const nameEntry = await getNameEntry(connection, "twitter", "cardinal_labs");
  console.log(nameEntry);
};

getNameEntryData("mainnet").catch((e) => console.log(e));
