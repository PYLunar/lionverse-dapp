# Development

The coursework edition keeps only four visible traits. Add no hidden genetics, browser collection simulation, or marketplace without an explicit scope change.

- Solidity ownership/state: contracts/LionNFT.sol.
- Trait rules: contracts/LionTraits.sol.
- On-chain art: contracts/LionArt.sol.
- UI labels: src/domain/catalog.js.
- RPC/wallet access: src/services/blockchain.js.
- React screens: src/App.jsx.

Use npm run format, then npm run check. For wallet or transaction changes also run the local EVM browser scenario documented in README.md.

Changing the contract layout requires compiling, synchronizing the ABI and deploying a new contract. Never claim a testnet deployment without a real address and transaction.

Only four traits influence the SVG. Keep metadata and visual interpretation aligned. Fonts and their licenses are in public/fonts; scripts/update-fonts.py is optional font maintenance.

Do not commit .env.local, dependencies, build outputs or private keys.
