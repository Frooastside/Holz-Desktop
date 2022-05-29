import { app, BrowserWindow, ipcMain, IpcMainEvent } from "electron";
import isDev from "electron-is-dev";
import { readFileSync } from "fs";
import Handlebars from "handlebars";
import { join } from "path";
import { Browser } from "puppeteer-core";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import pie from "puppeteer-in-electron";

puppeteer.use(StealthPlugin());
pie.initialize(app);

let browser: Browser;

async function createWindow() {
  browser = (await pie.connect(app, puppeteer as any)) as any;
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
  const port = process.env.PORT || 8000;
  const url = isDev ? `http://localhost:${port}` : join(__dirname, "../dist/index.html");

  if (isDev) {
    window?.loadURL(url);
  } else {
    window?.loadFile(url);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

const solverFile = join(__dirname, "solver.handlebars");
export const solverTemplate = Handlebars.compile(readFileSync(solverFile).toString());

ipcMain.on("captcha", async (event: IpcMainEvent, captcha: { url: string; sitekey: string }) => {
  const window = new BrowserWindow({
    width: 480,
    height: 640,
    frame: false,
    show: true,
    resizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: join(__dirname, "captcha-preload.js"),
      sandbox: true
    }
  });
  const page = await pie.getPage(browser as any, window);
  await page.setRequestInterception(true);

  captcha.url = captcha.url;

  page.on("request", (request) => {
    if (request.url() === captcha.url && request.isNavigationRequest()) {
      request.respond({
        body: solverTemplate({ sitekey: captcha.sitekey })
      });
    } else {
      request.continue();
    }
  });

  await page.goto(captcha.url, { waitUntil: "networkidle0" });

  const timeout = setTimeout(() => {
    event.sender.send("error", "Timeout Error");
    window.close();
  }, 120000);

  ipcMain.once("result", (_event: IpcMainEvent, token: string) => {
    console.log(token);
    clearTimeout(timeout);
    event.sender.send("captcha", token);
    window.close();
  });
});
