const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

server.listen(port, () => {
  console.log(`server open ${port}`);
});
