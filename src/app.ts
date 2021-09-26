import * as express from "express";
import { createEngine } from "./createEngine";

const app: express.Express = express.default();
const port: number = 3000;
const ext: string = "js";
app.set("views", __dirname + "/pages");
app.set("view engine", ext);
app.engine(ext, createEngine());

app.get("/", (req, res) => {
  res.render("index", { word: "World" });
});

app.listen(port, () => console.log("Ready: localhost:3000"));
