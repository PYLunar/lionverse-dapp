# Remix deployment checklist

The production workflow is Remix, MetaMask and Sepolia. Once deployed, the DApp uses Ethers.js and the wallet to access the contracts. Remix does not need to stay open.

## Prepare and compile

1. Open [Remix IDE](https://app.remix.live/) in a browser with MetaMask.
2. Create a dedicated workspace and import `remix/Lionverse.sol` from this repository.
3. Import the supplied `remix/remix.config.json` into that workspace.
4. Select Solidity **0.8.28+commit.7893614a** and **Use configuration file**.
5. Compile with the optimizer enabled, **200 runs**, **viaIR enabled** and EVM target **Paris**. Verify these settings in Compilation Details.

The portable source includes both project contracts and the pinned OpenZeppelin dependencies. `LionTraits` and `LionArt` have internal functions and need no separate deployment.

## Deploy to Sepolia

1. Unlock MetaMask, select Sepolia (chain ID **11155111**) and obtain test ETH for gas.
2. In Deploy & Run, select **Browser Extension / MetaMask**. Keep the transaction value at zero.
3. Deploy **LionNFT**, which has no constructor arguments. Save its address and deployment receipt.
4. Deploy **LionMarketplace**, passing the NFT address as its `collection` argument. Save the market address and receipt.
5. Read the marketplace's `nft()` value and confirm that it equals the deployed NFT address.

Remix VM is a separate in-browser blockchain. Use the wallet's Sepolia network for the shared testnet demonstration.

## Connect and verify

From the repository root in PowerShell:

```powershell
npm ci
npm run remix:connect -- --nft YOUR_NFT_ADDRESS --market YOUR_MARKET_ADDRESS
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

The connection command validates the chain, deployed code and NFT-market binding before writing public frontend settings. It does not sign or deploy anything. Open the printed local URL, connect MetaMask on Sepolia and test the application.

Both participants must use the same chain and contract addresses. A teammate using the existing hosted website does not need to deploy another contract pair.

For the complete procedure, compiler configuration and troubleshooting, see [the detailed Remix guide](../remix/README.md). The shared deployment and successful receipts are recorded in [Deployment-Sepolia.md](Deployment-Sepolia.md).
