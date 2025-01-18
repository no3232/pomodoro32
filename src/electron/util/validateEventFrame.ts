import { WebFrameMain } from "electron";
import isDev from "./isDev.js";
import { pathToFileURL } from "url";
import { getUIPath } from "./pathResolver.js";

// cors와 동일한 패턴
// 실제 url파일로 선언된 출처로 부터 들어온 요청인지를 확인하자.
const validateEventFrame = (frame: WebFrameMain) => {
  if (isDev() && new URL(frame.url).host == "localhost:3000") {
    return;
  }
  if (frame.url !== pathToFileURL(getUIPath()).toString()) {
    throw new Error(
      `Malicious event ${frame.url} !== ${pathToFileURL(
        getUIPath()
      ).toString()}`
    );
  }
};

export default validateEventFrame;
