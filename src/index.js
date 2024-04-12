const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const crypto = require("crypto");

require("dotenv").config();

const { saveMessages, fetchMessages } = require("./utils/messages");

const app = express();
const port = 3000;

// 몽고디비 연결
mongoose
  .connect(process.env.MONGO_DB)
  .then(() => {
    console.log("mongodb connected");
  })
  .catch((err) => {
    console.log(err);
  });

const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// 유저 세션 데이타  클라이언트와 연결
app.post("/session", (req, res) => {
  let data = {
    username: req.body.username,
    userID: randomID(),
  };
  res.send(data);
});
const randomID = () => {
  return crypto.randomBytes(8).toString("hex");
};

// 소켓 미들웨어
io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  const userID = socket.handshake.auth.userID;
  if (!username) {
    return next(new Error("Invalid username"));
  }
  // 클라이언트 socketConnect()
  // socket connection 할 때 socket 데이터에서 받아올 수 있다. (io.on(connection))
  socket.username = username;
  socket.id = userID;
  next();
});

// 유저를 담을 곳
let users = [];
// socket 전체 연동
io.on("connection", async (socket) => {
  // 연결된 사람들만 미들웨어에서 데이터 받아옴
  let userData = { username: socket.username, userID: socket.id };
  users.push(userData);
  // socket room에 보냄
  io.emit("users-data", { users });

  // 클라이언트에서 보내온 메시지
  // 클라이언트에서 온 메시지 상대방에게 전달
  socket.on("message-to-server", (payload) => {
    // 클라이언트에서 온 메시지를 서버로 받고 서버에서 상대방에게 메시지 전달
    io.to(payload.to).emit("message-to-client", payload);
    saveMessages(payload);
  });

  // 데이터베이스에서 메시지 가져오기
  socket.on("fetch-messages", ({ receiver }) => {
    fetchMessages(io, socket.id, receiver);
  });

  // 유저가 방에서 나갔을 때
  socket.on("disconnect", () => {
    // 내가 나갔으니 나를 제외한 사람들 보여주기
    users = users.filter((user) => user.userID !== socket.id);
    // 사이드바에서 리스트 없애기
    io.emit("users-data", { users });
    // 대화 중이라면 대화창 없애기
    io.emit("user-away", socket.id);
  });
});
server.listen(port, () => {
  console.log(`server open ${port}`);
});
