import { app, BrowserWindow } from "electron";
import isDev from "./util/isDev.js";
import { getPreloadPath, getUIPath } from "./util/pathResolver.js";
import { ipcMainHandle, ipcMainOn } from "./util/ipc.js";
import ProxyManager from "./feature/proxy/proxyManager.js";
import TimerManager from "./feature/timer/timerManager";

const proxyManager = new ProxyManager();
const timerManager = new TimerManager();

// 메인 자체는 하나의 컴포넌트라고 생각하면 편하다.
// 이벤트를 할당해서 특정 이벤트가 발생했을 때 특정 함수를 실행하도록 하는 것이다.
// 하지만 이벤트를 일으킬 때는 브라우저에서 직접 일으켜서는 안된다.
// 따라서 preload.js에서 이벤트를 일으켜야 한다.
app.on("ready", () => {
  proxyManager.setupProxy();

  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  if (isDev()) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(getUIPath());
  }

  ipcMainOn("startBlock", (payload: { allowedUrls: string[] }) => {
    proxyManager.startBlocking(payload.allowedUrls);
  });
  ipcMainOn("stopBlock", () => {
    proxyManager.stopBlocking();
  });

  // 렌더러로 시간 업데이트 전송
  timerManager.onTick((remainingTime) => {
    mainWindow.webContents.send("timer:update", remainingTime);
  });
});

app.on("before-quit", () => {
  timerManager.cleanup();
});

app.on("window-all-closed", async () => {
  await proxyManager.cleanup();
  app.quit();
});
