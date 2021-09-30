import * as React from "react";
import ReactDOM from "react-dom";
import { Button, TextField } from "@mui/material";
import * as io from "socket.io-client";
import axios, { AxiosRequestConfig } from "axios";

const ioPort: number = 3001;
const appServer: string = `http://localhost:${ioPort}`;
const socket: io.Socket = io.io(appServer, {
  withCredentials: true,
});

function App() {
  socket.on("connect", () => console.log("接続"));
  const [channelId, setChannelId] = React.useState<string>("");
  const inputChannelId = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannelId(e.target.value);
  };
  const sendClick = async () => {
    console.log("押された");
    socket.emit("hoge", "Test送信");
    await axios.post(appServer, { channelId: channelId });
  };
  const endClick = async () => {
    await axios.post(appServer, {});
  };
  return (
    <>
      <TextField onChange={inputChannelId}></TextField>
      <Button id="sendButton" onClick={sendClick}>
        トラッキング開始
      </Button>
      <Button onClick={endClick}>トラッキング終了</Button>
    </>
  );
}
ReactDOM.render(<App />, document.querySelector("#app"));
