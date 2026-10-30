# Lionverse — Coursework Edition

A small React + Ethers.js + Solidity DApp: mint, collect, breed, transfer, trade and burn lion NFTs.

## Data and rules

Each lion has **four visible traits**: species, fur, mane, eyes. It also stores generation, birth time, and two parent IDs. Ownership comes from ERC-721. Images (SVG) and metadata are on-chain.

Founder mint probabilities:

- Natural species combined: **60%**
- Monochrome prismatic: **30%**
- Rainbow prismatic: **10%**

Within natural species, field / snow / gold / diamond retain relative weights 6200 / 2400 / 900 / 350. Fur has 6 choices, mane 3, eyes 4. Rarity is a UI label derived from species, not an extra stored random trait.

For breeding, each of the four traits independently inherits one parent's visible value with a 50% chance. There are no hidden genes or mutations. The child generation is max(parent generations) + 1. Both parents must be different and owned by the caller. Parents and newborns rest for 5 minutes. Minting is free except network gas; the lifetime cap of 10,000 includes offspring and burned tokens.

Block-based randomness is sufficient for an educational testnet demo but is influenceable and unsuitable for paid draws. Minting remains free. The separate market supports fixed-price trading.

## Permanent NFT burning

Open an owned lion's detail, choose Burn NFT, enter its exact numeric token ID and select Confirm Permanent Burn. The wallet still asks to sign the burn transaction. Closing the confirmation or rejecting the wallet request leaves the NFT intact.

Only the current owner can burn; token approvals and operator approvals do not grant that permission. A listed NFT belongs to the market escrow, so the seller must cancel its listing first. Burning provides no refund or reward.

Burned tokens disappear from wallet/global enumeration and cannot be transferred, listed or bred. IDs are never reused. `totalSupply()` is the active count, while `totalMinted()` counts lifetime births; burning does not reopen minting capacity.

For lineage, `getLion()` preserves historical traits and parent IDs. `isBurned()` distinguishes a destroyed known token from one never minted. Standard `ownerOf()` and `tokenURI()` reject burned IDs; `historicalTokenURI()` explicitly returns archived metadata/SVG with a burned flag. A descendant's parent link shows “Burned · Historical record” without actionable ownership controls.

This feature requires deploying a new NFT and its matching market; an existing non-upgradeable contract cannot gain burn functionality. Deployments archive the old address record. Old NFTs, listings and seller proceeds are not automatically migrated.

## NFT market

- Open an owned lion's detail, enter a price in ETH and select List for Sale.
- Approve only that token, then confirm the listing (normally two wallet transactions). Cancelling the second step leaves the NFT in the wallet; the approval remains and may be revoked or reused.
- Listing transfers the NFT into LionMarketplace escrow. It is absent from the seller's wallet collection and cannot breed while listed.
- Buyers pay the exact listed ETH amount plus network gas. The transfer and seller credit occur atomically; a failed NFT transfer rolls the whole purchase back.
- Only the seller can cancel an active listing. Cancellation returns the NFT.
- After a sale, the seller opens the market and selects Withdraw Proceeds. No platform fee or royalty is deducted.
- Sale events record token ID, seller, buyer and price in wei. A normal wallet transfer does not imply a sale.

The market is bound to a single LionNFT contract. Use the listing flow rather than transferring NFTs directly to the market address. Unsolicited safe transfers are rejected; an unsafe ERC-721 transferFrom can still send a token without a listing and there is no admin rescue. The test suite covers permissions, exact payment, repeat buys, receiver rejection, withdrawal failure and withdrawal reentry.

## Run on Windows PowerShell

Install Node.js 22.12+ or 24 LTS including npm. Python and virtual environments are not required.

```powershell
npm ci
```

Terminal 1 (keep running):

```powershell
npm run chain
```

Terminal 2:

```powershell
npm run deploy:local
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173. Connect MetaMask in a browser with the extension enabled.
The local network RPC is http://127.0.0.1:8545, chain ID 31337. Import one of the **public, local-only** Hardhat test accounts. Never send real assets to these accounts. The in-app browser may not expose a wallet extension.

Full deployment creates both NFT and market contracts, updates only frontend connection settings in .env.local, and saves both addresses/transaction hashes in deployments/31337.json. Restarting the local chain clears its state: deploy again. No browser-based demo collection is used; the collection is read from the configured contract.

To add a market to an existing local simplified NFT contract without changing that NFT address or its collection:

```powershell
npm run deploy:market:local
```

This uses the current VITE_CONTRACT_ADDRESS / VITE_CHAIN_ID. Redeploying the market does not migrate old listings or proceeds: use their original market contract to cancel or withdraw.

## Sepolia

Copy .env.example to .env.local **only if you do not already have one**. Set SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY to a dedicated test wallet with Sepolia test ETH, then:

```powershell
npm run deploy:sepolia
npm run dev
```

Deployment writes `VITE_CONTRACT_ADDRESS`, `VITE_MARKET_ADDRESS`, `VITE_CHAIN_ID`, `VITE_RPC_URL`. Never put secrets in `VITE_` variables. Add both deployed addresses and confirmed transaction links to your submission after actual deployment; none is claimed here.

## Checks

```powershell
npm run check
npx playwright install chromium
npm run test:ui
```

check runs ESLint, Prettier, contract tests and production build. UI tests check the four-page interface and wallet-required state. To run the full browser-to-EVM flow, keep the local chain running and deploy a **new empty NFT/market pair** first:

```powershell
npm run deploy:local
$env:LION_CHAIN_TEST="1"
npm run test:ui
Remove-Item Env:LION_CHAIN_TEST
```

The test uses unlocked local accounts via a test-only wallet adapter. It mints two NFTs, rejects a transaction, advances local EVM time, breeds, transfers, switches accounts, reads a parent, lists, cancels, buys and withdraws proceeds. It also tests burn confirmation, wallet rejection, destruction, archived-parent navigation and non-reused IDs. It does not replace a real MetaMask/Sepolia demonstration.

## Source map

- contracts/LionNFT.sol — ERC-721 ownership, mint, breed, burn, lifetime cap and archived metadata
- contracts/LionTraits.sol — four-trait random selection and inheritance
- contracts/LionArt.sol — on-chain SVG renderer
- contracts/LionMarketplace.sol — fixed-price escrow, purchase and withdrawal
- src/App.jsx — Mint / My Lions / Breed / Market and NFT detail
- src/components/MarketPage.jsx — listings, purchase/cancel and seller proceeds
- src/services/blockchain.js — wallet, reads, transaction confirmation
- src/domain/catalog.js — display names and derived rarity
- scripts/deploy.cjs — local/Sepolia deployment
- scripts/deploy-market.cjs — add a market to an existing local NFT deployment
- scripts/sync-abi.mjs — copy compiled ABI to frontend
- test/ — Solidity behavior and probability boundary tests
- tests/ui/ — browser checks and optional real local-EVM scenario

## Previous version

The full hidden-genetics edition is preserved on the local branch backup/full-genetics. This simplified edition needs a **new deployment** because its data layout and ABI differ. Old contracts/NFTs remain at their old addresses. Existing browser demo data is left untouched but is not used.

Report PDF, English demo video (under 15 minutes), team contribution distribution and personal peer submission must be prepared separately for COMP7610. No Sepolia deployment is assumed from local tests.
