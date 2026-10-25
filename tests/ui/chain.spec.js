import { test, expect } from "@playwright/test";
import { JsonRpcProvider } from "ethers";

test("local EVM: mint, reject, inherit, transfer, change account and inspect parents", async ({
  page,
}) => {
  test.skip(
    process.env.LION_CHAIN_TEST !== "1",
    "Requires a running local chain and a freshly deployed contract.",
  );
  const rpc = new JsonRpcProvider("http://127.0.0.1:8545");
  const accounts = await rpc.send("eth_accounts", []);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.addInitScript(
      ({ accounts }) => {
        const listeners = {};
        let account = accounts[0];
        window.__reject = false;
        window.__setAccount = (next) => {
          account = next;
          (listeners.accountsChanged || []).forEach((fn) => fn([next]));
        };
        window.ethereum = {
          on: (event, fn) => {
            (listeners[event] ||= []).push(fn);
          },
          removeListener: (event, fn) => {
            listeners[event] = (listeners[event] || []).filter((item) => item !== fn);
          },
          request: async ({ method, params = [] }) => {
            if (["eth_requestAccounts", "eth_accounts"].includes(method))
              return [account];
            if (method === "eth_sendTransaction" && window.__reject)
              throw Object.assign(new Error("User rejected"), { code: 4001 });
            const response = await fetch("http://127.0.0.1:8545", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
            });
            const data = await response.json();
            if (data.error)
              throw Object.assign(new Error(data.error.message), data.error);
            return data.result;
          },
        };
      },
      { accounts },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "连接钱包", exact: true }).click();
    await expect(page.locator(".wallet-button")).toContainText("0xf39");
    const ids = [];
    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: "铸造一只狮子", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 20000 });
      ids.push((await dialog.getByRole("heading").innerText()).match(/#(\d+)/)[1]);
      await expect(dialog.locator("dl > div")).toHaveCount(4);
      await page.getByLabel("关闭弹窗").click();
    }
    await page.evaluate(() => {
      window.__reject = true;
    });
    await page.getByRole("button", { name: "铸造一只狮子", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("取消了钱包操作");
    await page.evaluate(() => {
      window.__reject = false;
    });
    await page.getByRole("button", { name: "繁育", exact: true }).click();
    await expect(page.getByLabel("选择亲代 A").locator("option")).toHaveCount(3);
    await page.getByLabel("选择亲代 A").selectOption(ids[0]);
    await page.getByLabel("选择亲代 B").selectOption(ids[0]);
    await expect(page.getByRole("alert")).toContainText("请选择两只不同");
    await page.getByLabel("选择亲代 B").selectOption(ids[1]);
    await expect(page.getByRole("button", { name: /冷却中/ })).toBeDisabled();
    await rpc.send("evm_increaseTime", [301]);
    await rpc.send("evm_mine", []);
    const block = await rpc.getBlock("latest");
    await page.clock.setFixedTime(new Date((block.timestamp + 1) * 1000));
    await page.getByRole("button", { name: "繁育新狮子", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("GEN 1", { timeout: 20000 });
    await expect(dialog.locator(".parents")).toContainText("#" + ids[0]);
    await dialog.locator("#recipient").fill("0x0000000000000000000000000000000000000000");
    await dialog.getByRole("button", { name: "转赠 NFT", exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText("请输入有效的接收地址");
    await dialog.locator("#recipient").fill(accounts[1]);
    await dialog.getByRole("button", { name: "转赠 NFT", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("转赠已在链上确认", {
      timeout: 20000,
    });
    await expect(dialog).toHaveCount(0);
    await page.evaluate((next) => window.__setAccount(next), accounts[1]);
    await expect(page.locator(".wallet-button")).toContainText("连接钱包");
    await page.getByRole("button", { name: "我的狮群", exact: true }).click();
    await page.locator(".wallet-button").click();
    await expect(page.locator(".lion-card")).toHaveCount(1, { timeout: 15000 });
    await page.locator(".lion-card").click();
    await expect(dialog).toContainText("GEN 1");
    await dialog
      .locator(".parents")
      .getByRole("button", { name: "#" + ids[0], exact: true })
      .click();
    await expect(dialog.getByRole("heading")).toHaveText("狮子 #" + ids[0]);
    await expect(
      dialog.getByRole("button", { name: "转赠 NFT", exact: true }),
    ).toHaveCount(0);
    await page.getByLabel("关闭弹窗").click();
    await page.locator(".lion-card").click();
    const childId = (await dialog.getByRole("heading").innerText()).match(/#(\d+)/)[1];
    await dialog.getByLabel("挂单价格（ETH）").fill("0");
    await dialog.getByRole("button", { name: "上架出售", exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText("必须大于 0");
    await dialog.getByLabel("挂单价格（ETH）").fill("0.01");
    await dialog.getByRole("button", { name: "上架出售", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("NFT 已上架", {
      timeout: 20000,
    });
    await page.getByRole("button", { name: "交易市场", exact: true }).click();
    await expect(page.locator(".market-card")).toHaveCount(1);
    await expect(page.locator(".market-card")).toContainText("0.01 ETH");
    await page.getByRole("button", { name: "撤销挂单", exact: true }).click();
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog.getByRole("status")).toContainText("已撤销");
    await dialog.getByLabel("挂单价格（ETH）").fill("0.01");
    await dialog.getByRole("button", { name: "上架出售", exact: true }).click();
    await expect(dialog).toHaveCount(0, { timeout: 20000 });
    await expect(page.locator(".market-card")).toHaveCount(1);
    await page.evaluate((next) => window.__setAccount(next), accounts[0]);
    await page.locator(".wallet-button").click();
    await page.getByRole("button", { name: "购买 NFT", exact: true }).click();
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog.getByRole("status")).toContainText("购买成功");
    await expect(dialog.getByRole("heading")).toHaveText("狮子 #" + childId);
    await page.getByLabel("关闭弹窗").click();
    await expect(page.locator(".market-card")).toHaveCount(0);
    await page.getByRole("button", { name: "我的狮群", exact: true }).click();
    await expect(page.locator(".lion-card")).toHaveCount(3);
    await page.evaluate((next) => window.__setAccount(next), accounts[1]);
    await page.locator(".wallet-button").click();
    await page.getByRole("button", { name: "交易市场", exact: true }).click();
    await expect(page.locator(".market-balance")).toContainText("0.01 ETH");
    await page.getByRole("button", { name: "领取成交款", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("已领取到钱包", {
      timeout: 20000,
    });
    await expect(page.locator(".market-balance")).toContainText("0.0 ETH");
    await expect(
      page.getByRole("button", { name: "领取成交款", exact: true }),
    ).toBeDisabled();
    expect(errors).toEqual([]);
  } finally {
    rpc.destroy();
  }
});
