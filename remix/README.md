# Deploy Lionverse with Remix

This is the primary deployment workflow. The web app connects to deployed contracts using Ethers.js and MetaMask; it does not connect to the Remix editor at runtime. No private key is needed in the project for this workflow.

## 1. Import and compile

The ready-to-use `Lionverse.sol` contains both project contracts and all required OpenZeppelin 5.4.0 source files. It needs no remote Solidity imports. Keep the accompanying MIT license notices. Both libraries have internal functions, so they require no separate deployment.

1. Open [Remix IDE](https://remix.ethereum.org/) in a browser with MetaMask.
2. Create a dedicated workspace and upload `Lionverse.sol` from this folder (unzip the handoff archive first, if using it). In current Remix, replace the new workspace's default `remix.config.json` contents with the supplied `remix.config.json`. This is a new dedicated workspace, so there is no existing project configuration to preserve.
3. In Solidity Compiler choose **0.8.28+commit.7893614a**.
4. Open Advanced Configurations and choose **Use configuration file**. Current Remix reads the `solidity-compiler` section of `remix.config.json`; its **Update config** link opens that file. For older versions with a file selector, upload and select the supplied `compiler_config.json` instead. Both supplied configurations set optimizer enabled, 200 runs, `viaIR: true`, and EVM target **Paris**, matching the original local build. Do not rely on compiler defaults.
5. Compile `Lionverse.sol`. Both `LionNFT` and `LionMarketplace` must appear in the contract selector. Verify the settings in Compilation Details. The file contains other interfaces/libraries; select the named project contracts below.

`manifest.json` records compiler settings, source hashes and the local portability check. Rebuild the bundle after changing contracts with `npm ci` and `npm run remix:prepare`. This preparation checks Solidity compilation, EVM runtime size, absence of library linking and equality with the frontend's two checked-in ABIs. It uses the pinned local Solidity compiler, not a Hardhat deployment.

## 2. Deploy with MetaMask to Sepolia

1. Unlock MetaMask, choose Sepolia (chain ID **11155111**) and have enough Sepolia test ETH for gas.
2. In Deploy & Run choose **Browser Extension / MetaMask** (older Remix versions call this Injected Provider). Confirm the displayed account and network. Keep **Value = 0**.
3. Select **LionNFT**. Its constructor has no arguments. Click Deploy and approve the deployment in MetaMask yourself. Wait for confirmation and copy the deployed NFT address and transaction hash.
4. Select **LionMarketplace**. Paste that NFT address into the constructor's `collection` argument. Deploy, approve in MetaMask, then copy the market address and transaction hash.
5. Call the market's read-only `nft()` function and check that it returns the NFT address. Record both deployment transactions for the report. Do not redeploy the NFT just to add the market.

Remix VM is useful for practice but its private in-browser chain is not Sepolia and is not the chain the Vite app reads. For the app demonstration, deploy with the browser wallet to Sepolia. A Remix VM deployment does not satisfy the coursework's public testnet requirement.

## 3. Connect the existing frontend

In this repository's PowerShell terminal run, replacing the two placeholders with actual addresses:

```powershell
npm ci
npm run remix:connect -- --nft YOUR_NFT_ADDRESS --market YOUR_MARKET_ADDRESS
npm run dev -- --host 127.0.0.1
```

For a different Sepolia RPC, add `--rpc https://YOUR_SEPOLIA_RPC`. The connection command performs read-only checks: chain ID, deployed code, NFT configuration and the market's NFT binding. It saves a connection record under deployments/ and updates only the four frontend settings in .env.local. It performs no signing and does not authenticate the provenance of arbitrary third-party contracts; use your own freshly deployed addresses. Existing NFTs, listings and credits are not migrated by changing addresses.

The frontend ABIs already match this exact bundle, so there is no manual ABI copy for an unchanged bundle. If you change the contract interfaces, review and synchronize ABIs before rebuilding; do not use stale ABI files.

You can instead edit these public frontend values manually, keeping unrelated local settings intact:

```dotenv
VITE_CONTRACT_ADDRESS=YOUR_NFT_ADDRESS
VITE_MARKET_ADDRESS=YOUR_MARKET_ADDRESS
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

## 4. Manual demo checklist

- Connect the app's MetaMask wallet to Sepolia, mint two lions and wait for each receipt.
- Wait five minutes, breed the two parents and inspect the child's traits and parent links.
- Transfer a lion to a second wallet, then switch the app to that wallet.
- Approve one NFT, list it for a small test ETH price, and buy from a different wallet.
- Return to the seller wallet and withdraw the sale proceeds.
- Cancel a separate listing to demonstrate returning escrowed ownership.
- Burn an owned NFT only when you intend to destroy it, using the exact-ID confirmation. Inspect a descendant's historical parent record if available.
- Save actual transaction links and both contract addresses for the report and English video.

Hardhat remains an optional local development/test tool. `npm test` runs the automated contract suite; no claim is made that those tests ran in Remix or on Sepolia.

## Official references

- [Compiler settings](https://remix-ide.readthedocs.io/en/latest/compile.html)
- [Deploy & Run and browser wallets](https://remix-ide.readthedocs.io/en/latest/run.html)
