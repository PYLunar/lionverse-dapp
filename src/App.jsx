import LionDetail from "./components/LionDetail.jsx";
import GalleryPage from "./pages/GalleryPage.jsx";
import useGameController from "./hooks/useGameController.js";
import FamilyPage from "./pages/FamilyPage.jsx";

import Badge from "./components/Badge.jsx";
import Spinner from "./components/Spinner.jsx";
import Modal from "./components/Modal.jsx";

import Habitat from "./components/Habitat.jsx";
import GuidePage from "./pages/GuidePage.jsx";
import BreedingPage from "./pages/BreedingPage.jsx";

import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Dna,
  ExternalLink,
  Heart,
  Leaf,
  Menu,
  GitFork,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Sprout,
  Wallet,
  X,
} from "lucide-react";
import LionPortrait from "./LionPortrait";
import { shortAddress } from "./domain/catalog.js";

import { initialDemo } from "./domain/demo.js";

import { CONFIGURED, EXPLORER, NETWORK } from "./services/blockchain.js";

const NAV = [
  ["explore", Compass, "探索狮屿"],
  ["collection", PawPrint, "我的狮群"],
  ["breed", Dna, "繁育小屋"],
  ["family", GitFork, "家谱图鉴"],
  ["guide", BookOpen, "图鉴与规则"],
];
const PAGE_NAMES = Object.fromEntries(NAV.map(([id, , label]) => [id, label]));
export default function App() {
  const game = useGameController();
  const {
    mode,
    page,
    mobileNav,
    setMobileNav,
    demo,
    wallet,
    chainLions,
    chainTotal,
    totalOwned,
    totalSupply,
    loading,
    loadError,
    setRefresh,
    setOffset,
    ownedPage,
    visibleLions,
    filtered,
    query,
    setQuery,
    rarity,
    setRarity,
    sort,
    setSort,
    detail,
    newborn,
    mintOpen,
    setMintOpen,
    recipient,
    setRecipient,
    parentA,
    setParentA,
    parentB,
    setParentB,
    busy,
    notice,
    setNotice,
    txHash,
    now,
    a,
    b,
    owned,
    resting,
    navigate,
    changeMode,
    connectWallet,
    perform,
    openDetail,
    tell,
    setDetail,
    featured,
    familyRoot,
    setFamilyRoot,
    isOwned,
    startBreeding,
  } = game;

  return (
    <div className="app-shell">
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="关闭导航"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("explore");
          }}
        >
          <span className="brand-icon">
            <PawPrint size={25} fill="currentColor" />
          </span>
          <span>
            狮屿<span className="brand-en">LIONVERSE</span>
          </span>
        </a>
        <div className="nav-label">你的小小数字世界</div>
        <nav aria-label="主导航">
          {NAV.map(([id, Icon, label]) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => navigate(id)}
              aria-current={page === id ? "page" : undefined}
            >
              <Icon size={20} />
              <span>{label}</span>
              {id === "collection" && <span className="nav-count">{totalOwned}</span>}
              {page === id && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="note-art">
            <Sprout size={30} />
            <span>✧</span>
          </div>
          <h3>每一只，都有自己的故事。</h3>
          <p>
            从一次小小的相遇，
            <br />
            开始你的狮屿冒险。
          </p>
          <button onClick={() => navigate("guide")}>
            了解狮屿 <ArrowRight size={14} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <span className="network-dot" />
          {mode === "demo" ? "演示世界 · 本地保存" : `${NETWORK} 测试网络`}
          <span className="version">v2.0</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="打开导航"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={22} />
            </button>
            <span>狮屿</span>
            <span className="slash">/</span>
            <strong>{PAGE_NAMES[page]}</strong>
          </div>
          <div className="topbar-actions">
            <div className="mode-switch" aria-label="运行模式">
              <button
                className={mode === "demo" ? "selected" : ""}
                onClick={() => changeMode("demo")}
                disabled={busy}
              >
                演示模式
              </button>
              <button
                className={mode === "chain" ? "selected" : ""}
                onClick={() => changeMode("chain")}
                disabled={busy}
              >
                链上模式
              </button>
            </div>
            <button className="wallet-button" onClick={connectWallet} disabled={busy}>
              <Wallet size={16} />
              <span>{wallet ? shortAddress(wallet) : "连接钱包"}</span>
            </button>
          </div>
        </header>

        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> A LITTLE WILD. UNIQUELY YOURS.
              </div>
              <h1>
                {page === "explore" ? "欢迎来到，你的狮屿" : PAGE_NAMES[page]}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {page === "explore"
                  ? "遇见一只独特的狮子，收藏一段只属于你的故事。"
                  : page === "collection"
                    ? "每一位小伙伴，都是不可替代的存在。"
                    : page === "family"
                      ? "追溯每一次相遇，发现藏在基因里的可能。"
                      : page === "breed"
                        ? "让两份独特相遇，迎接一个全新的小生命。"
                        : "认识这里的每一种独特，也了解它们如何诞生。"}
              </p>
            </div>
            <div className="world-label">
              <Leaf size={14} />
              {mode === "demo" ? "正在探索演示世界" : NETWORK}
            </div>
          </div>
          {mode === "demo" && (
            <div className="demo-banner">
              <span>
                <Sparkles size={15} />
                当前为演示模式，收藏保存在本浏览器，不是真实 NFT。
              </span>
              <button onClick={() => changeMode("chain")}>
                进入链上世界 <ArrowRight size={14} />
              </button>
            </div>
          )}
          {mode === "chain" && !CONFIGURED && (
            <div className="setup-banner">
              <ShieldCheck size={22} />
              <div>
                <strong>你的链上世界，等待开启</strong>
                <p>
                  先按项目 README 部署 LionNFT
                  合约并配置地址，然后重新启动页面。现在可以切回演示模式体验全部玩法。
                </p>
              </div>
            </div>
          )}

          {page === "explore" && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="hero-kicker">
                    <span /> MEET YOUR FIRST LION
                  </div>
                  <h2>
                    有一点野，
                    <br />
                    有亿点<span>独一无二。</span>
                  </h2>
                  <p>
                    随机基因，天生不同。
                    <br />
                    领养、收藏、繁育，建立你的专属狮群。
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setMintOpen(true)}
                    disabled={busy || (mode === "chain" && !CONFIGURED)}
                  >
                    <PawPrint size={18} />
                    领养随机狮子
                    <ArrowRight size={17} />
                  </button>
                  <div className="hero-footnote">
                    <ShieldCheck size={13} />
                    {mode === "demo"
                      ? "免费体验 · 无需钱包 · 即刻相遇"
                      : "免费铸造 · 仅需测试网 Gas"}
                  </div>
                </div>
                <div className="hero-scene">
                  <Habitat />
                  <div className="orbit-note">
                    <Sparkles size={14} />
                    天生独特的链上伙伴
                  </div>
                  <LionPortrait lion={featured} decorative />
                  <div className="hero-lion-label">
                    <span className="label-paw">
                      <PawPrint size={19} />
                    </span>
                    <div>
                      <strong>
                        日冕 <span>Sol</span>
                      </strong>
                      <small>GEN 0 · 黄金狮</small>
                    </div>
                    <Badge rarity={featured.rarity} />
                  </div>
                  <div className="hero-art-caption">外观示例 · 由基因绘制</div>
                </div>
              </section>
              <section className="stats" aria-label="狮屿概况">
                <div>
                  <span className="stat-icon">
                    <PawPrint size={21} />
                  </span>
                  <div>
                    <span>{mode === "demo" ? "演示世界的狮子" : "已诞生的狮子"}</span>
                    <strong>
                      {totalSupply.toLocaleString()}
                      <small>/ 10,000</small>
                    </strong>
                  </div>
                </div>
                <div>
                  <span className="stat-icon lilac">
                    <Dna size={21} />
                  </span>
                  <div>
                    <span>理论特征组合</span>
                    <strong>
                      130.6 万<small>种特征组合</small>
                    </strong>
                  </div>
                </div>
                <div>
                  <span className="stat-icon gold">
                    <Heart size={21} />
                  </span>
                  <div>
                    <span>我的小伙伴</span>
                    <strong>
                      {totalOwned}
                      <small>只专属狮子</small>
                    </strong>
                  </div>
                  <button
                    className="stat-link"
                    aria-label="查看我的狮群"
                    onClick={() => navigate("collection")}
                  >
                    <ArrowRight size={19} />
                  </button>
                </div>
              </section>
            </>
          )}

          {(page === "explore" || page === "collection") && (
            <GalleryPage
              {...{
                page,
                mode,
                visibleLions,
                chainTotal,
                busy,
                setMintOpen,
                rarity,
                setRarity,
                query,
                setQuery,
                sort,
                setSort,
                chainLions,
                loadError,
                setRefresh,
                loading,
                filtered,
                isOwned,
                openDetail,
                ownedPage,
                wallet,
                connectWallet,
                setOffset,
              }}
            />
          )}

          {page === "breed" && (
            <BreedingPage
              {...{
                loadError,
                setRefresh,
                a,
                b,
                parentA,
                setParentA,
                parentB,
                setParentB,
                owned,
                now,
                busy,
                mode,
                chainLions,
                chainTotal,
                loading,
                setOffset,
                resting,
                perform,
              }}
            />
          )}

          {page === "family" && (
            <FamilyPage
              key={`${mode}:${wallet}`}
              mode={mode}
              wallet={wallet}
              demo={demo}
              rootId={familyRoot}
              onRoot={setFamilyRoot}
              onDetail={openDetail}
              connectWallet={connectWallet}
              busy={busy}
            />
          )}
          {page === "guide" && <GuidePage />}

          <footer>
            <span className="footer-brand">
              <PawPrint size={15} /> LIONVERSE <span>用一点好奇心，收藏一份独特。</span>
            </span>
            <span>
              生于链上，陪伴日常 <span className="footer-sparkle">✦</span>
            </span>
          </footer>
        </main>
      </div>

      {notice && (
        <div
          className={`toast ${notice.kind}`}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          <span>
            {busy ? (
              <Spinner />
            ) : notice.kind === "success" ? (
              <Check size={19} />
            ) : (
              <Sparkles size={19} />
            )}
          </span>
          <div>
            {notice.message}
            {txHash &&
              (EXPLORER ? (
                <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noreferrer">
                  查看交易 <ExternalLink size={12} />
                </a>
              ) : (
                <small>交易：{shortAddress(txHash)}</small>
              ))}
          </div>
          <button
            className="icon-button"
            aria-label="关闭通知"
            onClick={() => setNotice(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {mintOpen && (
        <Modal title="领养随机狮子" close={() => setMintOpen(false)} busy={busy}>
          <div className="mint-modal">
            <span className="round-icon">
              <PawPrint size={31} />
            </span>
            <div className="eyebrow">A NEW FRIEND AWAITS</div>
            <h2>你的下一位伙伴，会是什么模样？</h2>
            <p>
              品种、外形与天赋特征随机生成。
              <br />
              它的编号独一无二，故事由你继续。
            </p>
            <div className="mint-preview">
              {[initialDemo()[0], initialDemo()[2], initialDemo()[4]].map((l) => (
                <LionPortrait key={l.id} lion={l} />
              ))}
            </div>
            <div className="mint-summary">
              <span>{mode === "demo" ? "演示领养" : "NFT 铸造"}</span>
              <strong>
                免费{" "}
                <small>{mode === "demo" ? "· 仅保存在本浏览器" : "+ 网络 Gas"}</small>
              </strong>
            </div>
            <button
              className="primary-button wide"
              disabled={busy}
              onClick={() => perform("mint")}
            >
              {busy ? <Spinner /> : <Sparkles size={18} />}{" "}
              {busy
                ? "正在等待确认…"
                : mode === "demo"
                  ? "揭晓我的小狮子"
                  : "连接钱包并铸造"}
            </button>
            <small>
              {mode === "demo"
                ? "演示收藏不是真实 NFT，不会发送链上交易。"
                : `在 ${NETWORK} 创建 ERC-721，需在钱包中确认。`}
            </small>
          </div>
        </Modal>
      )}

      {detail && (
        <LionDetail
          {...{
            detail,
            setDetail,
            busy,
            newborn,
            mode,
            isOwned,
            now,
            tell,
            recipient,
            setRecipient,
            perform,
            navigate,
            startBreeding,
            setFamilyRoot,
          }}
        />
      )}
    </div>
  );
}
