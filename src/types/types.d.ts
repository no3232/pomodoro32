// 이벤트 페이로드 타입
type EventPayloadMapping = {
  startBlock: { allowedUrls: string[] };
  stopBlock: void;
};

// 이벤트 구독 해제 함수
type UnsubscribeFunction = () => void;

// 이벤트 페이로드 타입을 브라우저에서 사용할 수 있도록 선언
// API 타입 선언이라고 보면 편하다.
// input과 output을 선언하는 것이다.
interface Window {
  electron: {
    startBlock: (payload: { allowedUrls: string[] }) => void;
    stopBlock: () => void;
  };
}
