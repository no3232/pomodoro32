import "./App.css";

function App() {
  return (
    <>
      <button
        onClick={() => {
          window.electron.startBlock({
            allowedUrls: ["www.google.com", "www.naver.com", "naver.com", "www.dogdrip.net"],
          });
        }}
      >
        Test
      </button>
      <button
        onClick={() => {
          window.electron.stopBlock();
        }}
      >
        TestEnd
      </button>
    </>
  );
}

export default App;
