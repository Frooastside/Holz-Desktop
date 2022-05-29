import { ipcRenderer, contextBridge } from "electron";

declare global {
  interface Window {
    api: typeof api;
  }
}

const api = {
  solveCaptcha: (url?: string, sitekey?: string) => {
    ipcRenderer.send("captcha", {
      url: url ?? "https://www.google.com/recaptcha/api2/demo",
      sitekey: sitekey ?? "6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-"
    });
  },

  on: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  }
};

contextBridge.exposeInMainWorld("api", api);
