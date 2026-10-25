import { readFile, writeFile } from "node:fs/promises";

for (const name of ["LionNFT", "LionMarketplace"]) {
  const artifact = JSON.parse(
    await readFile(`artifacts/contracts/${name}.sol/${name}.json`, "utf8"),
  );
  await writeFile(
    `src/generated/${name}.abi.json`,
    JSON.stringify(artifact.abi, null, 2) + "\n",
  );
}
