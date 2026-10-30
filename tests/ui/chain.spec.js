import { test, expect } from "@playwright/test";
import { JsonRpcProvider } from "ethers";
import { expectEnglish } from "./english.js";

test.use({ locale: "zh-CN" });

test("local EVM: mint, reject, inherit, transfer, change account and inspect parents", async ({
  page,
}) => {
  test.skip(
    process.env.LION_CHAIN_TEST !== "1",
    "Requires a running local chain and a freshly deployed contract.",
  );
  const rpcUrl = process.env.LION_TEST_RPC_URL || "http://127.0.0.1:8545";
  const rpc = new JsonRpcProvider(rpcUrl);
  const accounts = await rpc.send("eth_accounts", []);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.addInitScript(
      ({ accounts, rpcUrl }) => {
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
            const response = await fetch(rpcUrl, {
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
      { accounts, rpcUrl },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Connect Wallet", exact: true }).click();
    await expect(page.locator(".wallet-button")).toContainText("0xf39");
    const ids = [];
    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: "Mint a Lion", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 20000 });
      ids.push(
        (await dialog.getByRole("heading", { level: 2 }).innerText()).match(/#(\d+)/)[1],
      );
      await expect(dialog.locator("dl > div")).toHaveCount(4);
      await expectEnglish(page);
      await page.getByLabel("Close dialog").click();
    }
    await page.evaluate(() => {
      window.__reject = true;
    });
    await page.getByRole("button", { name: "Mint a Lion", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("canceled the wallet request");
    await page.evaluate(() => {
      window.__reject = false;
    });
    await page.getByRole("button", { name: "Breed", exact: true }).click();
    await expect(page.getByLabel("Select parent A").locator("option")).toHaveCount(3);
    await page.getByLabel("Select parent A").selectOption(ids[0]);
    await page.getByLabel("Select parent B").selectOption(ids[0]);
    await expect(page.getByRole("alert")).toContainText("Please choose two different");
    await page.getByLabel("Select parent B").selectOption(ids[1]);
    await expect(page.getByRole("button", { name: /Resting/ })).toBeDisabled();
    await expectEnglish(page);
    await rpc.send("evm_increaseTime", [301]);
    await rpc.send("evm_mine", []);
    const block = await rpc.getBlock("latest");
    await page.clock.setFixedTime(new Date((block.timestamp + 1) * 1000));
    await page.getByRole("button", { name: "Breed a Lion", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("GEN 1", { timeout: 20000 });
    await expect(dialog.locator(".parents")).toContainText("#" + ids[0]);
    await dialog.locator("#recipient").fill("0x0000000000000000000000000000000000000000");
    await dialog.getByRole("button", { name: "Transfer NFT", exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Please enter a valid recipient address",
    );
    await dialog.locator("#recipient").fill(accounts[1]);
    await dialog.getByRole("button", { name: "Transfer NFT", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Transfer confirmed on-chain", {
      timeout: 20000,
    });
    await expect(dialog).toHaveCount(0);
    await page.evaluate((next) => window.__setAccount(next), accounts[1]);
    await expect(page.locator(".wallet-button")).toContainText("Connect Wallet");
    await page.getByRole("button", { name: "My Pride", exact: true }).click();
    await page.locator(".wallet-button").click();
    await expect(page.locator(".lion-card")).toHaveCount(1, { timeout: 15000 });
    await page.locator(".lion-card").click();
    await expect(dialog).toContainText("GEN 1");
    await dialog
      .locator(".parents")
      .getByRole("button", { name: "#" + ids[0], exact: true })
      .click();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Lion #" + ids[0]);
    await expect(
      dialog.getByRole("button", { name: "Transfer NFT", exact: true }),
    ).toHaveCount(0);
    await page.getByLabel("Close dialog").click();
    await page.locator(".lion-card").click();
    const childId = (await dialog.getByRole("heading", { level: 2 }).innerText()).match(
      /#(\d+)/,
    )[1];
    await dialog.getByLabel("Listing price (ETH)").fill("0");
    await dialog.getByRole("button", { name: "List for Sale", exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText("must be greater than 0");
    await dialog.getByLabel("Listing price (ETH)").fill("0.01");
    await dialog.getByRole("button", { name: "List for Sale", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("NFT listed", {
      timeout: 20000,
    });
    await page.getByRole("button", { name: "Marketplace", exact: true }).click();
    await expect(page.locator(".market-card")).toHaveCount(1);
    await expect(page.locator(".market-card")).toContainText("0.01 ETH");
    await expectEnglish(page);
    await page.getByRole("button", { name: "Cancel Listing", exact: true }).click();
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog.getByRole("status")).toContainText("Listing canceled");
    await dialog.getByLabel("Listing price (ETH)").fill("0.01");
    await dialog.getByRole("button", { name: "List for Sale", exact: true }).click();
    await expect(dialog).toHaveCount(0, { timeout: 20000 });
    await expect(page.locator(".market-card")).toHaveCount(1);
    await page.evaluate((next) => window.__setAccount(next), accounts[0]);
    await page.locator(".wallet-button").click();
    await page.getByRole("button", { name: "Buy NFT", exact: true }).click();
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog.getByRole("status")).toContainText("Purchase complete");
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(
      "Lion #" + childId,
    );
    await page.getByLabel("Close dialog").click();
    await expect(page.locator(".market-card")).toHaveCount(0);
    await page.getByRole("button", { name: "My Pride", exact: true }).click();
    await expect(page.locator(".lion-card")).toHaveCount(3);
    await page.evaluate((next) => window.__setAccount(next), accounts[1]);
    await page.locator(".wallet-button").click();
    await page.getByRole("button", { name: "Marketplace", exact: true }).click();
    await expect(page.locator(".market-balance")).toContainText("0.01 ETH");
    await page.getByRole("button", { name: "Withdraw Proceeds", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("withdrawn to your wallet", {
      timeout: 20000,
    });
    await expect(page.locator(".market-balance")).toContainText("0.0 ETH");
    await expect(
      page.getByRole("button", { name: "Withdraw Proceeds", exact: true }),
    ).toBeDisabled();
    await page.evaluate((next) => window.__setAccount(next), accounts[0]);
    await page.locator(".wallet-button").click();
    await page.getByRole("button", { name: "My Pride", exact: true }).click();
    await expect(page.locator(".lion-card")).toHaveCount(3);
    await page
      .locator(".lion-card")
      .filter({ hasText: "Lion #" + ids[0] })
      .click();
    await dialog.getByRole("button", { name: "Burn NFT", exact: true }).click();
    await expect(
      dialog.getByRole("button", { name: "Confirm Permanent Burn", exact: true }),
    ).toBeDisabled();
    await dialog.locator("#burn-confirm-id").fill("wrong");
    await expect(
      dialog.getByRole("button", { name: "Confirm Permanent Burn", exact: true }),
    ).toBeDisabled();
    await page.getByLabel("Close dialog").click();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Lion #" + ids[0]);
    await dialog.getByRole("button", { name: "Burn NFT", exact: true }).click();
    await dialog.locator("#burn-confirm-id").fill(ids[0]);
    await expectEnglish(page);
    await page.screenshot({ path: "tmp/previews/burn-confirm.png", fullPage: true });
    await page.evaluate(() => {
      window.__reject = true;
    });
    await dialog
      .getByRole("button", { name: "Confirm Permanent Burn", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toContainText("canceled the wallet request");
    await page.evaluate(() => {
      window.__reject = false;
    });
    await dialog
      .getByRole("button", { name: "Confirm Permanent Burn", exact: true })
      .click();
    await expect(dialog).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByRole("status")).toContainText("permanently burned");
    await expect(page.locator(".lion-card")).toHaveCount(2);
    await page
      .locator(".lion-card")
      .filter({ hasText: "Lion #" + childId })
      .click();
    await dialog
      .locator(".parents")
      .getByRole("button", { name: "#" + ids[0], exact: true })
      .click();
    await expect(dialog).toContainText("Burned · Historical record");
    await expectEnglish(page);
    await page.screenshot({ path: "tmp/previews/burn-history.png", fullPage: true });
    await expect(
      dialog.getByRole("button", { name: "Burn NFT", exact: true }),
    ).toHaveCount(0);
    await expect(
      dialog.getByRole("button", { name: "List for Sale", exact: true }),
    ).toHaveCount(0);
    await page.getByLabel("Close dialog").click();
    await page.getByRole("button", { name: "Mint", exact: true }).click();
    await expect(page.locator(".footnote")).toContainText("3 / 10,000");
    await expect(page.locator(".footnote")).toContainText("Active supply: 2");
    await page.getByRole("button", { name: "Mint a Lion", exact: true }).click();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Lion #4", {
      timeout: 20000,
    });
    expect(errors).toEqual([]);
  } finally {
    rpc.destroy();
  }
});
