import { ipcRenderer, contextBridge } from "electron";

declare global {
  interface Window {
    api: typeof api;
  }
}

const api = {
  solveCaptcha: (cid: string) => {
    ipcRenderer.send("captcha", cid);
  },

  on: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  }
};

contextBridge.exposeInMainWorld("api", api);
