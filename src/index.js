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

// 유저를 담을 곳
let users = [];
// socket 전체 연동
io.on("connection", async (socket) => {
  // 유저의 데이타를 객체로 users에 담음
  let userData = {};
  users.push(userData);
  // socket room에 보냄
  io.emit("users-data", { users });

  // 클라이언트에서 보내온 메시지
  socket.on("message-to-server", () => {});

  // 데이터베이스에서 메시지 가져오기
  socket.on("fetch-messages", () => {});

  // 유저가 방에서 나갔을 때
  socket.on("disconnect", () => {});
});
server.listen(port, () => {
  console.log(`server open ${port}`);
});
