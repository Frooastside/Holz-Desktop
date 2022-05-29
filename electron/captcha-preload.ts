import { contextBridge, ipcRenderer } from "electron";

declare global {
  interface Window {
    __injectionHandler: (token: string) => void;
  }
}

function injectionHandler(token: string): void {
  ipcRenderer.send("result", token);
}

contextBridge.exposeInMainWorld("__injectionHandler", injectionHandler);
