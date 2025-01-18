import isDev from "./isDev.js";
import path from "path";
import { app } from "electron";

const getPreloadPath = () => {
  return path.join(
    app.getAppPath(),
    isDev() ? "." : "..",
    "/dist-electron/preload.mjs"
  );
};

const getUIPath = () => {
  return path.join(
    app.getAppPath(),
    isDev() ? "." : "..",
    "/dist-react/index.html"
  );
};

const getAssetsPath = () => {
  return path.join(app.getAppPath(), isDev() ? "." : "..", "/src/assets/");
};

export { getPreloadPath, getUIPath, getAssetsPath };
