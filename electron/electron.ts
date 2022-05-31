import { app, BrowserWindow, ipcMain, IpcMainEvent } from "electron";
import isDev from "electron-is-dev";
import fetch from "node-fetch";
import { join } from "path";
import { Browser } from "puppeteer-core";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import pie from "puppeteer-in-electron";
import { stringify } from "querystring";
import { validate } from "uuid";
import solve from "./solver";

let browser: Browser;

puppeteer.use(StealthPlugin());
pie.initialize(app);

async function createMainWindow() {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    frame: true,
    show: true,
    resizable: true,
    fullscreenable: false,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      sandbox: true
    }
  });

  //const deeplink = new Deeplink({ app: app, mainWindow: window, protocol: "holz", isDev: isDev });
  //deeplink.on("received", (link: string) => {
  //  console.log(link);
  //});

  const port = process.env.PORT || 8000;
  const url = isDev ? `http://localhost:${port}` : join(__dirname, "../dist/index.html");

  if (isDev) {
    window?.loadURL(url);
  } else {
    window?.loadFile(url);
  }
}

app.whenReady().then(async () => {
  browser = (await pie.connect(app, puppeteer as any)) as any;
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("captcha", async (event: IpcMainEvent, cid?: string) => {
  try {
    if (!cid || !validate(cid)) {
      throw new Error("Invalid cid.");
    }
    const response = await fetch(`https://holz.wolkeneis.dev/api/?${stringify({ cid: cid })}`, {
      method: "GET"
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const fetchedCaptcha: {
      cid: string;
      url: string;
      sitekey: string;
      token?: string;
      creationDate?: number;
    } = await response.json();
    if (fetchedCaptcha.token) {
      throw new Error("Already solved.");
    }
    const token = await solve(browser, fetchedCaptcha);
    const patchResponse = await fetch("https://holz.wolkeneis.dev/api/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...fetchedCaptcha,
        token: token
      })
    });
    if (!patchResponse.ok) {
      throw new Error(await patchResponse.text());
    }
    event.sender.send("captcha", fetchedCaptcha.cid);
  } catch (error) {
    event.sender.send("error", (error as Error)?.toString());
  }
});
