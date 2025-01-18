import electron from "electron";

electron.contextBridge.exposeInMainWorld("electron", {
  startBlock: (payload: { allowedUrls: string[] }) => {
    ipcSend("startBlock", payload);
  },
  stopBlock: () => {
    ipcSend("stopBlock", undefined);
  },
} satisfies Window["electron"]);

// fetch와 동일

// invoke는 요청 - 응답
// fetch라고 생각하면 좋다.
function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key);
}

// 이벤트 구독 -> SSE, websocket과 비슷함
function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void
) {
  const cb = (
    _: Electron.IpcRendererEvent,
    payload: EventPayloadMapping[Key]
  ) => callback(payload);
  electron.ipcRenderer.on(key, cb);
  return () => {
    electron.ipcRenderer.off(key, cb);
  };
}

// 단방향 이벤트 발신 응답은 필요가 없는 경우
// 특정 이벤트를 보낸 후에 OS단에서 이벤트가 발생 후 끝나는 경우
function ipcSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  payload: EventPayloadMapping[Key]
) {
  electron.ipcRenderer.send(key, payload);
}
