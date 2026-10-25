# 狮屿 Lionverse v2

独立的狮子 NFT 收藏与繁育游戏，参考 `Project Tutorial.pdf` 的 React → Ethers → Solidity → Sepolia 架构。每只狮子都是 ERC-721 藏品，具有唯一身份、18 个等位基因、不可变家谱和基因驱动的 SVG 外观。

本目录不引用外层量化项目，使用专用 `.venv` 与本地 Node 依赖，不使用 `quant` 环境。

## 体验与启动

```bash
cd lionverse-dapp
# 如果仍在 quant/Conda 环境，先 conda deactivate 退出。
# 当前工作区已经创建 .venv；新机器首次执行下一行：
python3 -m venv --without-pip .venv
source .venv/bin/activate
npm ci
npm run dev
```

打开 **http://localhost:5173**。当前工作区依赖已安装，可直接激活环境并启动。需要 Node.js 22 LTS；Python 只用于隔离终端与可选字体维护，应用由 Node.js 运行。Windows 与 WSL 的 `node_modules` 和虚拟环境不能混用，应在各自系统重新安装。

默认演示模式无需钱包，包含六只展示狮子、三只自有狮子。收藏保存在当前浏览器，不是真实 NFT。示例中的稀有狮子与隐性携带者是预设展示，不代表随机抽样结果。

## 本版玩法

- **随机领养**：原野、雪域、黄金、钻石、普通炫彩、黑白炫彩六类品种。稀有形态包括晶体角冠、金属胸甲、极光飘带、日蚀光环等。
- **双等位基因**：每项从双亲各继承一份，普通特征可携带不显现的稀有基因；详情可查看完整基因对。
- **配对预览**：四种基础遗传组合、计入变异后的特征概率，以及普通炫彩和黑白炫彩的最终概率。
- **家谱**：详情进入家谱，或输入任意编号查询。显示父母、祖辈与分页直系子代，点击节点继续追溯；转赠不会断开血缘。
- **个人图鉴**：根据完整的当前自有收藏统计已显现、仅携带和未收录的基因。转赠后刷新会变化，不是永久成就。
- **钱包操作**：MetaMask 等 EIP-1193 钱包连接、网络切换、签名取消处理、交易确认与 NFT 转赠。

家谱可查询任何藏品，不依赖“我的狮群”的分页结果。个人图鉴按同一区块快照分批读取，加载完成前会明确标记统计未完成。

功能预览：[家谱](docs/preview-family.png) · [基因图鉴](docs/preview-album.png) · [炫彩配对概率](docs/preview-forecast.png) · [黑白炫彩](docs/preview-monochrome.png)。截图使用演示样本，不代表实际抽样概率。

## 初代炫彩概率

| 初代品种 |     概率 |
| -------- | -------: |
| 原野     | 31.4721% |
| 雪域     | 12.1827% |
| 黄金     |  4.5685% |
| 钻石     |  1.7766% |
| 普通炫彩 |      25% |
| 黑白炫彩 |      25% |

初代随机铸造的炫彩总概率为 **50%**，其中普通炫彩和黑白炫彩各为 **25%**。繁育仍使用独立判定：两位已显现炫彩的亲代，子代炫彩总概率最高 **6%**，其余 **94%** 为非炫彩品种；两位无光谱倾向的普通狮子为 **0.1%**。携带者和单炫彩亲代有介于两者之间的小幅提升。

没有黑白倾向的普通炫彩双亲，产生黑白炫彩的最终概率为 **0.006%**；即使黑白双亲，其子代再次成为黑白炫彩也只有 **0.06%**。这是理论概率，没有保底、唯一性保证或黑白总量配额。

所有概率、基因顺序、变异及条件概率计算见 [遗传协议](docs/GENETICS.md)。普通特征每项有 12.5% 概率重抽一份等位基因，重抽可能仍是原值。

## 本地链

终端 A：

```bash
source .venv/bin/activate
npm run chain
```

终端 B：

```bash
source .venv/bin/activate
npm run deploy:local
npm run dev
```

部署脚本先编译并同步 ABI，再部署到 `http://127.0.0.1:8545`，chain ID `31337`。它更新 `.env.local`，将旧部署记录归档至 `deployments/<chain>-<address>.json`。配置变化后重新启动前端。

在钱包中使用 Hardhat 提供的仅限本地测试账户，再点击“连接钱包”。测试账户不得存放真实资产。本地节点重启会清空其 NFT 与交易历史，需要重新部署。

## Sepolia

```bash
cp .env.example .env.local
# 编辑 SEPOLIA_RPC_URL 和专用测试钱包的 DEPLOYER_PRIVATE_KEY
npm run deploy:sepolia
npm run dev
```

钱包需要测试 ETH 支付 Gas。部署脚本写入前端使用的 `VITE_CONTRACT_ADDRESS`、`VITE_CHAIN_ID`、`VITE_RPC_URL`。带 `VITE_` 前缀的变量会暴露给浏览器，不能包含私钥或保密 RPC 凭证。

本项目没有自动发布到 Sepolia 或主网。已完成的链上验证使用本地 Hardhat 节点。

## v1 数据升级

新版合约提供 `GENETICS_VERSION()`、`getGenes()`、`childCount()`、`childrenOf()`。前端检测版本，拒绝把旧合约的数据解释成新协议。

旧合约不可升级：新版部署到新地址，旧 NFT 仍保留在旧合约中，不会原地增加隐藏基因。没有暗中销毁、迁移或重铸旧资产。

演示收藏自动从 `lionverse-demo-v2` 迁移到 `lionverse-demo-v3`。旧键保留，编号、主人、外观、时间、双亲和冷却均保留。缺少历史双基因的旧数据采用同型基因并显示迁移提示，不伪造历史隐性特征。

## 工程与验证

```bash
npm run format
npm run check
npx playwright install chromium
npm run test:ui
```

`check` 包含配置生成一致性、ESLint、格式检查、纯逻辑单元测试、Solidity 编译与 ABI 同步、合约测试、生产构建。详见 [工程规范](CONTRIBUTING.md)。

当前 Linux 浏览器共享库在本项目 `.venv/browser-libs`，测试可这样运行：

```bash
LD_LIBRARY_PATH="$PWD/.venv/browser-libs/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}" npm run test:ui
```

要运行完整 EVM 浏览器测试，保持本地节点运行，先向该节点部署一个新空合约，然后加上 `LION_CHAIN_TEST=1` 执行浏览器测试。覆盖真实铸造、繁育、拒绝签名、转赠、账号切换与跨所有权家谱查询。

## 结构

```text
shared/genetics.json       基因顺序、权重和炫彩规则的权威配置
contracts/LionNFT.sol      ERC-721、基因存储、冷却、亲缘索引
contracts/LionGenetics.sol 纯遗传算法
contracts/LionArt.sol      链上简化 SVG
contracts/generated/      自动生成的概率配置
src/domain/               纯遗传、家谱、图鉴和演示规则
src/services/             钱包/RPC、存储校验与迁移
src/hooks/                请求生命周期和应用状态
src/pages/                探索、繁育、家谱图鉴、规则页面
src/components/           基因表、概率预览、家谱节点等组件
src/generated/            编译产物生成的 ABI
scripts/                  生成、部署和字体维护
tests/unit/              纯逻辑与迁移测试
test/                    Solidity 行为和跨语言一致性测试
tests/ui/                浏览器回归测试
```

## 技术边界

- NFT 身份由链 ID、合约地址、token ID 唯一确定；外观和基因组合可以重复。
- 元数据、基因与简化 SVG 均在链上，前端绘制更细致的形态。没有外部图片服务器，字体也随项目提供；授权见 `public/fonts`。
- 目前采用教学用链上伪随机数，不能抵抗调用者或区块生产者筛选结果。正式赋予资产经济价值前，需要 VRF 等可验证随机源及合约审计。
- 铸造和繁育免费，只支付 Gas；总量上限 10,000，含子代。双亲与新生幼崽有 5 分钟冷却。达到上限后不能继续出生。
- 不含战斗、付费代币、市场、质押或经济收益机制；性格和部分特征目前用于收藏与外观。
