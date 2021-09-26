import * as React from "react";
import ReactDOM from "react-dom";
import { Button, TextField } from "@mui/material";
import * as io from "socket.io-client";

const socket: io.Socket = io.default();

function App() {
  const [text, setText] = React.useState("");
  const [msgList, setMsgList] = React.useState<string[]>([]);
  const addMsgList = (msg: string) => {
    console.log("kita");
    setMsgList([...msgList, msg]);
  };
  socket.on("hoge", (msg: string) => {
    console.log(msg);
    addMsgList(msg);
  });
  const sendClick = () => {
    socket.emit("hoge", text);
    setText("");
  };
  return (
    <>
      <TextField
        id="sendContents"
        onChange={(e) => setText(e.target.value)}
      ></TextField>
      <Button id="sendButton" onClick={sendClick}>
        Send
      </Button>
      <ul>
        {msgList.map((msg: string, index: number) => {
          <li key={index}>{msg}</li>;
        })}
      </ul>
    </>
  );
}
ReactDOM.render(<App />, document.querySelector("#app"));
