# Lionverse deployment records

Verified on 2026-11-01.

## Public frontend

- URL: https://symphonious-sherbet-47ba97.netlify.app/
- Hosting: Netlify, project `symphonious-sherbet-47ba97`.
- Initial team-only access returned HTTP 401. The project was made public for the requested two-computer demonstration; an unauthenticated HTTP request then returned 200.
- The published application bundle `/assets/index-Nwwh7oWj.js` matches the local production build. Its NFT address, marketplace address and chain ID match the records below.
- A separate visitor browser check could not finish because browser automation timed out. The Netlify embedded preview had displayed the English UI and three active lions. Real wallet transactions from the public URL, including a second computer, still need to be demonstrated.

## Sepolia contracts

Network: Sepolia, chain ID `11155111`. Compiled with Solidity 0.8.28, optimizer enabled with 200 runs, viaIR enabled and Paris EVM target; deployed through Remix and MetaMask.

| Contract        | Address                                      | Deployment transaction                                                                                                     |
| --------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| LionNFT         | `0x853E3613Be4d66D656bE481A377c314bfe40e97e` | [Confirmed deployment](https://sepolia.etherscan.io/tx/0xbbb4a7ff5b407d59e01edec13ab635d6125bcfd3505016ca764ec424d854a248) |
| LionMarketplace | `0x2af1853622a2FDcEdA675850D4a8385591718154` | [Confirmed deployment](https://sepolia.etherscan.io/tx/0x15078577f7ed99ad86a76fd6213badae91e1ec5cb7909ee6d9ea14750491b6eb) |

Both creation receipts were checked against Sepolia RPC: status 1, NFT block 12039727 and market block 12039745. The marketplace's read-only `nft()` result matches the NFT address above. Local detailed records are kept under ignored `deployments/` JSON files.

## Second-computer demonstration

1. Open the public frontend URL in Chrome with MetaMask available.
2. Connect that computer's own wallet and select Sepolia. No contract deployment or Remix installation is required on the second computer.
3. Keep some Sepolia test ETH for transaction gas and the selected listing price.
4. The seller lists an owned NFT, confirming approval and listing. The buyer opens Marketplace and refreshes to see the same token ID and price.
5. The buyer confirms purchase, then checks My Pride. The seller withdraws proceeds separately.
6. Save the listing, buyer ownership and withdrawal screenshots, together with actual transaction links.

The earlier Chinese PDF is a discussion draft from before public deployment; update its deployment section, test count and team contributions before final submission. Changing the frontend URL does not migrate or reset the existing Sepolia NFTs, listings or seller credits.
