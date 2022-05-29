import { app, BrowserWindow, ipcMain, IpcMainEvent } from "electron";
import { Deeplink } from "electron-deeplink";
import isDev from "electron-is-dev";
import { join } from "path";
import { Browser } from "puppeteer-core";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import pie from "puppeteer-in-electron";
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

  const deeplink = new Deeplink({ app: app, mainWindow: window, protocol: "holz", isDev: isDev });
  deeplink.on("received", (link: string) => {
    console.log(link);
  });

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

ipcMain.on("captcha", async (event: IpcMainEvent, captcha: { cid: string; url: string; sitekey: string }) => {
  try {
    const token = await solve(browser, captcha);
    event.sender.send("captcha", token);
  } catch (error) {
    event.sender.send("error", (error as Error).message);
  }
});
