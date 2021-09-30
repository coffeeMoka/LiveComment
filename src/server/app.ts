import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import cors from "cors";

const htmlApp: express.Express = express.default();
const htmlServer: http.Server = http.createServer(htmlApp);
const htmlPort: number = 3000;
const htmlOrigin: string = `http://localhost:${htmlPort}`;

const apiApp: express.Express = express.default();
const apiServer: http.Server = http.createServer(apiApp);
const apiPort: number = 3001;
const apiOrigin: string = `http://localhost:${apiPort}`;

const io: socketio.Server = new socketio.Server(apiServer, {
  cors: {
    origin: htmlOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

htmlApp.use(
  cors({
    origin: apiOrigin,
  })
);
htmlApp.use(express.static("public"));

apiApp.use(
  cors({
    origin: htmlOrigin,
  })
);
io.on("connection", (socket: socketio.Socket) => {
  socket.on("hoge", (msg: string) => {
    console.log(msg);
    io.emit("hoge", msg);
  });
});

htmlServer.listen(htmlPort, () => console.log(`Ready: localhost:${htmlPort}`));

apiServer.listen(apiPort, () => console.log(`Ready: localhost:${apiPort}`));
