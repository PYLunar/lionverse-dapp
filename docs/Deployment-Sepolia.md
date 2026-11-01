# Lionverse deployment records

Deployment and operation receipts verified on 2026-11-02 (Asia/Shanghai).

## Public frontend

- URL: https://symphonious-sherbet-47ba97.netlify.app/
- Hosting: Netlify, project `symphonious-sherbet-47ba97`.
- Initial team-only access returned HTTP 401. The project was made public for the requested two-computer demonstration; an unauthenticated HTTP request then returned 200.
- The published application bundle `/assets/index-Nwwh7oWj.js` matches the local production build. Its NFT address, marketplace address and chain ID match the records below.
- Public access was checked again on 2026-11-02 and returned HTTP 200. The submitted manual demonstration includes two wallet accounts, successful operation receipts and a recipient-side My Pride screenshot showing tokens #10 and #11. It complements the local automated tests; it is not an automated wallet test of the hosted site.

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

Changing the frontend URL does not migrate or reset existing Sepolia NFTs, listings or seller credits.

## Verified operation receipts

The following transactions were supplied with the demonstration evidence and checked using read-only Sepolia RPC. Each receipt returned status 1. The input and emitted events were decoded with the project's ABIs. Different operations use different token IDs; the rows do not describe one continuous lifecycle for a single NFT.

| Operation    | Token or amount         | Block    | Receipt                                                                                                                       |
| ------------ | ----------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Founder mint | #12                     | 12042362 | [Successful mint](https://sepolia.etherscan.io/tx/0xe7dcd82ba8ef893d65ac5cb474af201b06c2fcc8ade1837ecabfa2776c226fd5)         |
| Breed        | #1 and #2 produce #13   | 12042420 | [Successful breed](https://sepolia.etherscan.io/tx/0xf7edc231fc5bc9d272cbd7e4af6416b7ed12b58b4cc8ecb10743a61ca35aaf36)        |
| Transfer     | #11, A to B             | 12041351 | [Successful transfer](https://sepolia.etherscan.io/tx/0x83ab5546aa44df44dda3fa6b000c165f4c2054426e1eb400a8b6a52994d44605)     |
| Approve      | #10 for the marketplace | 12041359 | [Successful approval](https://sepolia.etherscan.io/tx/0x0a1b3a3fefdac272f3346cfc97a3fbfcde576bc784a6f7015eb904ef590911f4)     |
| List         | #10 at 0.01 ETH         | 12041361 | [Successful listing](https://sepolia.etherscan.io/tx/0xbf1a57c97224c9ecf66be76a4e35b454811c3cd86a76b0532b4fbb24161e2d33)      |
| Buy          | #10, B pays 0.01 ETH    | 12041396 | [Successful purchase](https://sepolia.etherscan.io/tx/0xf6763d988946a2922d6abdb1462b59b7b60ff4bfbaf1cd89d13beda173c43ce0)     |
| Withdraw     | A receives 0.01 ETH     | 12041437 | [Successful withdrawal](https://sepolia.etherscan.io/tx/0xdb4177013aff5abc82333627804311887b7f4d50d354d2a642f71a337fe8a479)   |
| Cancel       | #2 returns to A         | 12042004 | [Successful cancellation](https://sepolia.etherscan.io/tx/0xccb79117886b6f37cc858da2e08f1859fe064f281513bf19db48f5d322600c8a) |
| Burn         | #8 destroyed            | 12041369 | [Successful burn](https://sepolia.etherscan.io/tx/0xc9e476fd4438bfe3fe18103b0b4c3e056457b0760713511cd56f2525e671465a)         |

At verification block 12042504, account B owned #10 and #11, account A owned #2, listing #2 was cleared, A's remaining seller proceeds were zero, and #8 was burned. These are historical snapshot results; later transactions may change live balances and ownership.

The local `npm test` run on 2026-11-02 passed 18 tests: nine NFT tests, eight marketplace tests and one connection-validation test. Rejection and reentrancy checks run locally, not as additional manual Sepolia transactions. Reports, screenshots, video and packaging outputs are maintained separately from the runnable source.
