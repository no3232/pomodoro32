import { ipcMain, WebContents } from "electron";
import validateEventFrame from "./validateEventFrame.js";

// 메인 프로세스에서 브라우저로 데이터를 보내는 함수.
// fetch 검증과 비슷한 패턴.
// adapter pattern
// type safe하게 만들었다.
const ipcMainHandle = <Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: () => EventPayloadMapping[Key]
) => {
  ipcMain.handle(key, (event) => {
    validateEventFrame(event.senderFrame!);
    return handler();
  });
};

// 브라우저에서 데인 프로세스로 데이터를 보내는 함수.
const ipcWebContentsSend = <Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key]
) => {
  webContents.send(key, payload);
};

const ipcMainOn = <Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void
) => {
  ipcMain.on(key, (event, payload) => {
    validateEventFrame(event.senderFrame!);
    callback(payload);
  });
};

export { ipcMainHandle, ipcWebContentsSend, ipcMainOn };
