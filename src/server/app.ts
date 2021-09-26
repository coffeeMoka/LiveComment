import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";

const app: express.Express = express.default();
const server: http.Server = http.createServer(app);
const io: socketio.Server = new socketio.Server(server);
const port: number = 3000;

app.use(express.static("public"));

io.on("connection", (socket: socketio.Socket) => {
  socket.on("hoge", (msg: string) => {
    console.log(msg);
    io.emit("hoge", msg);
  });
});

server.listen(port, () => {
  console.log("Ready: localhost:3000");
});
