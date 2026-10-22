import { readFile, writeFile } from "node:fs/promises";

const artifact = JSON.parse(
  await readFile("artifacts/contracts/LionNFT.sol/LionNFT.json", "utf8"),
);
await writeFile(
  "src/generated/LionNFT.abi.json",
  JSON.stringify(artifact.abi, null, 2) + "\n",
);
