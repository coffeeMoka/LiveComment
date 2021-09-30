import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import cors from "cors";
import { Live } from "./getYoutubeComment";

const htmlApp: express.Express = express.default();
const htmlServer: http.Server = http.createServer(htmlApp);
const htmlPort: number = 3000;
const htmlOrigin: string = `http://localhost:${htmlPort}`;

const apiApp: express.Express = express.default();
const apiServer: http.Server = http.createServer(apiApp);
const apiPort: number = 3001;
const apiOrigin: string = `http://localhost:${apiPort}`;

const live: Live = new Live();

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
apiApp.use(express.urlencoded({ extended: true }));
apiApp.use(express.json());
io.on("connection", (socket: socketio.Socket) => {
  socket.on("hoge", (msg: string) => {
    console.log(msg);
    io.emit("hoge", msg);
  });
});

apiApp.post("/", async (req: express.Request, res: express.Response) => {
  const channelId: string = req.body.channelId;
  if (channelId) {
    const liveId = await Live.getLiveFromChannelId(channelId);
    console.log(liveId);
    if (liveId) {
      live.liveId = liveId;
      live.begin(
        1000,
        () => console.log("kita"),
        (comments: Comment[]) => {
          const comment: Comment = comments.slice(-1)[0];
          console.log(comment);
        }
      );
      res.send("OK");
    }
  } else live.end();
});

htmlServer.listen(htmlPort, () => console.log(`Ready: localhost:${htmlPort}`));

apiServer.listen(apiPort, () => console.log(`Ready: localhost:${apiPort}`));
