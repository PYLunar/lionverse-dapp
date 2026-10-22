import { test, expect } from "@playwright/test";
import { JsonRpcProvider } from "ethers";

// This adapter only runs against an ephemeral local Hardhat node. Production uses
// the user's real EIP-1193 wallet and never includes a private key or test signer.
test("local chain: wallet, mint, breed, reject signature, transfer, and account changes", async ({
  page,
}) => {
  test.skip(
    process.env.LION_CHAIN_TEST !== "1",
    "Run after deploy:local with LION_CHAIN_TEST=1.",
  );
  const rpc = new JsonRpcProvider("http://127.0.0.1:8545");
  const accounts = await rpc.send("eth_accounts", []);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(
    ({ accounts }) => {
      const listeners = {};
      let account = accounts[0];
      window.__rejectTransaction = false;
      window.__setAccount = (next) => {
        account = next;
        (listeners.accountsChanged || []).forEach((fn) => fn([next]));
      };
      window.ethereum = {
        on: (event, handler) => {
          (listeners[event] ||= []).push(handler);
        },
        removeListener: (event, handler) => {
          listeners[event] = (listeners[event] || []).filter((fn) => fn !== handler);
        },
        request: async ({ method, params = [] }) => {
          if (method === "eth_requestAccounts" || method === "eth_accounts")
            return [account];
          if (method === "eth_sendTransaction" && window.__rejectTransaction)
            throw Object.assign(new Error("User rejected"), { code: 4001 });
          if (method === "wallet_switchEthereumChain") return null;
          const response = await fetch("http://127.0.0.1:8545", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
          });
          const json = await response.json();
          if (json.error) throw Object.assign(new Error(json.error.message), json.error);
          return json.result;
        },
      };
    },
    { accounts },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "连接钱包", exact: true }).click();
  await expect(page.locator(".wallet-button")).toContainText("0xf39");
  await expect(page.getByRole("button", { name: "链上模式", exact: true })).toHaveClass(
    "selected",
  );

  const ids = [];
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "领养随机狮子" }).click();
    await page.getByRole("button", { name: "连接钱包并铸造" }).click();
    await expect(page.locator(".detail-title")).toBeVisible({ timeout: 20000 });
    const text = await page.locator(".detail-title p").textContent();
    ids.push(String(Number(text.match(/#(\d+)/)[1])));
    await page.getByLabel("关闭弹窗").click();
  }

  await page.evaluate(() => {
    window.__rejectTransaction = true;
  });
  await page.getByRole("button", { name: "领养随机狮子" }).click();
  await page.getByRole("button", { name: "连接钱包并铸造" }).click();
  await expect(page.getByRole("alert")).toContainText("取消了钱包操作");
  await page.getByLabel("关闭弹窗").click();
  await page.evaluate(() => {
    window.__rejectTransaction = false;
  });

  await rpc.send("evm_increaseTime", [301]);
  await rpc.send("evm_mine", []);
  const block = await rpc.getBlock("latest");
  await page.clock.setFixedTime(new Date((block.timestamp + 1) * 1000));
  await page.getByRole("button", { name: "繁育小屋", exact: true }).click();
  await expect(page.getByLabel("选择亲代 A").locator("option")).toHaveCount(3);
  await page.getByLabel("选择亲代 A").selectOption(ids[0]);
  await page.getByLabel("选择亲代 B").selectOption(ids[1]);
  await page.getByRole("button", { name: "迎接新生命" }).click();
  await expect(page.locator(".detail-title")).toContainText("GEN 1", {
    timeout: 20000,
  });
  await page.locator("#recipient").fill(accounts[1]);
  await page.getByRole("button", { name: "转赠", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("转赠已在链上确认", {
    timeout: 20000,
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate((account) => window.__setAccount(account), accounts[1]);
  await page.getByRole("button", { name: /^我的狮群/ }).click();
  await expect(page.locator(".lion-card")).toHaveCount(1, { timeout: 15000 });
  await expect(page.locator(".lion-card")).toContainText("属于你的狮子");
  await page.locator(".lion-card").click();
  await page.locator(".gene-panel summary").click();
  await expect(page.locator(".gene-panel tbody tr")).toHaveCount(9);
  await page.getByRole("button", { name: "查看家谱", exact: true }).click();
  await expect(page.locator(".ancestry-tree .family-card")).toHaveCount(3);
  await page
    .getByRole("button", { name: `追溯日冕 #${ids[0].padStart(4, "0")}` })
    .click();
  await expect(page.locator(".children-grid .family-card")).toHaveCount(1);
  await expect(page.locator(".album-stats")).toContainText("1 / 1 只");
  expect(errors).toEqual([]);
  rpc.destroy();
});
