import * as React from "react";
import ReactDOM from "react-dom";
import { Button, TextField } from "@mui/material";
import * as io from "socket.io-client";

const ioPort: number = 3001;
const socket: io.Socket = io.io(`http://localhost:${ioPort}`, {
  withCredentials: true,
});

function App() {
  socket.on("connect", () => console.log("接続"));
  const sendClick = () => {
    console.log("押された");
    socket.emit("hoge", "Test送信");
  };
  return (
    <>
      <Button id="sendButton" onClick={sendClick}>
        Send
      </Button>
    </>
  );
}
ReactDOM.render(<App />, document.querySelector("#app"));
