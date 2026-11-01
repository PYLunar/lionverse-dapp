# Development

The coursework edition keeps only four visible traits and a fixed-price ETH marketplace. Add no hidden genetics or browser collection simulation without an explicit scope change.

- Solidity ownership/state: contracts/LionNFT.sol.
- Fixed-price escrow and ETH credits: contracts/LionMarketplace.sol.
- Trait rules: contracts/LionTraits.sol.
- On-chain art: contracts/LionArt.sol.
- UI labels: src/domain/catalog.js.
- RPC/wallet access: src/services/blockchain.js.
- React screens: src/App.jsx.

Use npm run format, then npm run check. For wallet or transaction changes also run the local EVM browser scenario documented in README.md.

Changing the contract layout requires compiling, synchronizing the ABI and deploying a new contract. Never claim a testnet deployment without a real address and transaction.

Remix is the primary compilation/deployment route: see remix/README.md. After source or ABI changes, run npm run remix:prepare to regenerate the self-contained bundle and validate it. Do not edit remix/Lionverse.sol directly. Keep compiler 0.8.28, optimizer 200, viaIR, Paris and OpenZeppelin 5.4.0 aligned. Connect actual Sepolia deployments using npm run remix:connect; the command only reads and configures, never signs. Hardhat deployment commands are for optional local tests.

Only four traits influence the SVG. Keep metadata and visual interpretation aligned. Fonts and their licenses are in public/fonts; scripts/update-fonts.py is optional font maintenance.

Do not commit .env.local, dependencies, build outputs or private keys.
