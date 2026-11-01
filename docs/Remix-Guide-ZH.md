# 使用 Remix 部署狮子项目

当前主流程是：Remix 编译与部署合约 → 取得两个地址 → 接入现有 DApp。网页通过 Ethers.js 和 MetaMask 直接连接区块链，运行时不需要打开 Remix。Hardhat 继续用于本地自动化测试。

## 一、准备与编译

1. 用安装了 MetaMask 的浏览器打开 https://remix.ethereum.org/ 。官方入口目前会转到 https://app.remix.live/ 。
2. 创建一个新的空工作区，例如 `Lionverse-Remix`。
3. 解压交付包，上传 `Lionverse.sol`。它已经包含 NFT、市场、属性、绘图和固定版本 OpenZeppelin 依赖，不用逐个复制合约或在线下载 Solidity 依赖。
4. 打开工作区的 `remix.config.json`，用交付包中同名文件的完整内容替换。这个步骤只在新建的专用工作区做。
5. 打开 Solidity Compiler，选择 **0.8.28+commit.7893614a**。
6. 展开 Advanced Configurations，选 **Use configuration file**。新版 Remix 使用 `remix.config.json` 中的 `solidity-compiler` 部分；如是有文件选择框的旧版，上传并选择包里的 `compiler_config.json`。
7. 切回 `Lionverse.sol`，点击 Compile。设置必须是：优化开启、200 次、`viaIR: true`、EVM 为 **Paris**。

编译后会出现很多合约名，其中多数是依赖库；实际只部署 `LionNFT` 和 `LionMarketplace`。`LionTraits`、`LionArt` 不需要单独部署。

## 二、在 Sepolia 部署

1. MetaMask 切到 Sepolia，并准备测试 ETH 支付 gas。
2. Remix 的 Deploy & Run 面板选择 **Browser Extension / MetaMask**；旧版可能显示 Injected Provider。确认网络是 Sepolia（11155111），Value 保持 0。
3. 先选择 `LionNFT`，不填构造参数，点击 Deploy，由你在钱包确认。交易确认后复制 NFT 地址和交易哈希。
4. 再选择 `LionMarketplace`，在构造参数 `collection` 中填入刚才的 NFT 地址，部署并在钱包确认。
5. 复制市场地址和交易哈希；调用市场的 `nft()` 只读函数，结果应等于 NFT 地址。

Remix VM 只是浏览器里的练习链，不能作为 Sepolia 部署证据，也无法直接被当前网页读取。正式演示请使用 MetaMask + Sepolia。

## 三、把两个地址接入网页

在项目目录的 PowerShell 里运行，把地址占位文字换成真实的部署地址：

```powershell
npm run remix:connect -- --nft 你的NFT地址 --market 你的市场地址
npm run dev -- --host 127.0.0.1
```

连接命令会检查网络、合约代码、NFT 基本配置和市场绑定关系。检查通过后才更新 `.env.local` 的前端配置，不会发送交易或索要私钥。首次下载项目先运行 `npm ci`。RPC 无法使用时，可在连接命令末尾加 `--rpc https://你的SepoliaRPC`。

包内合约没有改动时，现有 ABI 已经匹配，不需要手动复制。使用自己部署的地址；此命令不是第三方合约安全审计工具。

打开 http://127.0.0.1:5173/ ，在网页连接同一个 Sepolia 钱包即可使用现有铸造、收藏、繁育、转赠、买卖与销毁功能。切换到新地址不会迁移原来的 NFT、挂单或卖家余额。

## 四、项目修改之后

```powershell
npm run remix:prepare
npm run check
```

`remix:prepare` 根据原始合约重新生成单文件，校验编译设置、ABI、代码体积和依赖。不要直接修改生成的 `remix/Lionverse.sol`。`check` 中的 Hardhat 测试是本地测试，不代表 Remix 或 Sepolia 已经部署成功。

正式提交需保留两个合约地址、实际部署交易和操作交易链接，并补入报告。此前的中文 PDF 是改用 Remix 之前的讨论稿，部署章节与测试数量应在正式定稿时更新。
