# Lionverse / 狮屿 — Coursework Edition

A small React + Ethers.js + Solidity DApp: mint a lion NFT, view your wallet's collection, breed two lions, and transfer an NFT.

## Data and rules

Each lion has **four visible traits**: species, fur, mane, eyes. It also stores generation, birth time, and two parent IDs. Ownership comes from ERC-721. Images (SVG) and metadata are on-chain.

Founder mint probabilities:

- Natural species combined: **60%**
- Monochrome prismatic: **30%**
- Rainbow prismatic: **10%**

Within natural species, field / snow / gold / diamond retain relative weights 6200 / 2400 / 900 / 350. Fur has 6 choices, mane 3, eyes 4. Rarity is a UI label derived from species, not an extra stored random trait.

For breeding, each of the four traits independently inherits one parent's visible value with a 50% chance. There are no hidden genes or mutations. The child generation is max(parent generations) + 1. Both parents must be different and owned by the caller. Parents and newborns rest for 5 minutes. Minting is free except network gas; the cap of 10,000 includes offspring.

Block-based randomness is sufficient for an educational testnet demo but is influenceable and unsuitable for paid draws. This edition does not implement payment, trading, or burning.

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

Deployment updates only frontend connection settings in .env.local and saves the address/transaction hash in deployments/31337.json. Restarting the local chain clears its state: deploy again. No browser-based demo collection is used; the collection is read from the configured contract.

## Sepolia

Copy .env.example to .env.local **only if you do not already have one**. Set SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY to a dedicated test wallet with Sepolia test ETH, then:

```powershell
npm run deploy:sepolia
npm run dev
```

Deployment writes VITE*CONTRACT_ADDRESS, VITE_CHAIN_ID, VITE_RPC_URL. Never put secrets in VITE* variables. Add the deployed address and confirmed transaction links to your submission after actual deployment; none is claimed here.

## Checks

```powershell
npm run check
npx playwright install chromium
npm run test:ui
```

check runs ESLint, Prettier, contract tests and production build. UI tests check the three-page interface and wallet-required state. To run the full browser-to-EVM flow, keep the local chain running and deploy a **new empty contract** first:

```powershell
npm run deploy:local
$env:LION_CHAIN_TEST="1"
npm run test:ui
Remove-Item Env:LION_CHAIN_TEST
```

The test uses unlocked local accounts via a test-only wallet adapter. It mints two NFTs, rejects a transaction, advances local EVM time, breeds, transfers, switches accounts and reads a parent owned by someone else. It does not replace a real MetaMask/Sepolia demonstration.

## Source map

- contracts/LionNFT.sol — ERC-721 ownership, mint, breed, cooldown and metadata
- contracts/LionTraits.sol — four-trait random selection and inheritance
- contracts/LionArt.sol — on-chain SVG renderer
- src/App.jsx — Mint / My Lions / Breed and NFT detail/transfer
- src/services/blockchain.js — wallet, reads, transaction confirmation
- src/domain/catalog.js — display names and derived rarity
- scripts/deploy.cjs — local/Sepolia deployment
- scripts/sync-abi.mjs — copy compiled ABI to frontend
- test/ — Solidity behavior and probability boundary tests
- tests/ui/ — browser checks and optional real local-EVM scenario

## Previous version

The full hidden-genetics edition is preserved on the local branch backup/full-genetics. This simplified edition needs a **new deployment** because its data layout and ABI differ. Old contracts/NFTs remain at their old addresses. Existing browser demo data is left untouched but is not used.

Report PDF, English demo video (under 15 minutes), team contribution distribution and personal peer submission must be prepared separately for COMP7610. No Sepolia deployment is assumed from local tests.
