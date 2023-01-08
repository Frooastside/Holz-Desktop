import { BrowserWindow, ipcMain, IpcMainEvent } from "electron";
import { readFileSync } from "fs";
import Handlebars from "handlebars";
import { join } from "path";
import { Browser } from "puppeteer-core";
import pie from "puppeteer-in-electron";

const solverFile = join(__dirname, "solver.handlebars");
const solverTemplate = Handlebars.compile(readFileSync(solverFile).toString());

export default async function solve(
  browser: Browser,
  captcha: { url: string; sitekey: string; cid: string }
): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
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
      window.close();
      reject("Captcha Timeout.");
    }, 120000);

    ipcMain.once("result", (_event: IpcMainEvent, token: string) => {
      clearTimeout(timeout);
      window.close();
      resolve(token);
    });
  });
}
