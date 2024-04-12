// 서버 socket과 연동하는 부분
const socket = io("http://localhost:3000", {
  autoConnect: false, // 서버에 접속할 때 socket가 바로 연결하는 게 아닌 따로 connect 함수를 작성
  // 로그인하고 연결을 해야하기 때문에
});

// socket이 통신을 할 때마다 어떤 이벤트나 args가 컨솔에 찍을 수 있게 개발할 때 편하다.
socket.onAny((event, ...args) => {
  console.log(event, args);
});

const chatBody = document.querySelector(".chat-body");
const userTitle = document.getElementById("user-title");
const loginContainer = document.querySelector(".login-container");
const userTable = document.querySelector(".users");
const userTagline = document.querySelector("#users-tagline");
const title = document.querySelector("#active-user");
const messages = document.querySelector(".messages");
const msgDiv = document.querySelector(".msg-form");

// 유저가 로그인 입력했을 때 세션에 저장
const loginForm = document.querySelector(".user-login");
loginForm.addEventListener("submit", (e) => {
  e.preventDefault(); // 새로고침 막음
  const username = document.getElementById("username");
  createSession(username.value.toLowerCase());
  username.value = ""; // input 빈값
});

// 세션에 유저 저장 및 HTML 보여주기
const createSession = async (username) => {
  let options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  };
  // 서버에서 세션 데이터 받아오기 (app.post('/session'))
  await fetch("/session", options)
    .then((res) => res.json())
    .then((data) => {
      // 원래는 자동 connect를 false로 해놔서 유저가 입장할 때만 연결 시킨다.
      socketConnect(data.username, data.userID);

      localStorage.setItem("session-username", data.username);
      localStorage.setItem("session-userID", data.userID);

      loginContainer.classList.add("d-none");
      chatBody.classList.remove("d-none");
      userTitle.innerHTML = data.username;
    })
    .catch((err) => console.log(err));
};

// 소켓 유저 연결
const socketConnect = async (username, userID) => {
  socket.auth = { username, userID };
  // 원래는 자동 connect를 false로 해놔서 유저가 입장할 때만 연결 시킨다.
  await socket.connect();
};

// 메시지 보냈을 때 추가하기
const appendMessage = ({ message, time, background, position }) => {
  let div = document.createElement("div");
  div.classList.add(
    "message",
    "bg-opacity-25",
    "m-2",
    "px-2",
    "py-1",
    background,
    position
  );
  div.innerHTML = `<span class="msg-text">${message}</span><span class="msg-time">${time}</span>`;
  messages.append(div);
  messages.scrollTo(0, messages.scrollHeight);
};

// 상대 나갈 시 채팅방 없애기
socket.on("user-away", (userID) => {
  const to = title.getAttribute("userID");
  if (to === userID) {
    title.innerHTML = "&nbsp;";
    msgDiv.classList.add("d-none");
    messages.classList.add("d-none");
  }
});

// 서버에서 입장 된 유저들을 받아옴
socket.on("users-data", ({ users }) => {
  // 본인 제거
  const index = users.findIndex((user) => user.userID === socket.id);
  // -1이 아니라면 존재함
  if (index > -1) {
    // 내 위치에서 한개를 지움
    users.splice(index, 1);
  }

  // 생성하기 user table list
  userTable.innerHTML = "";
  let ul = `<table class="table table-hover">`;
  for (let user of users) {
    // 동적으로 만듦
    // this는 현재 데이터
    ul += `<tr class="socket-users" onclick="setActiveUser(this,'${user.username}', '${user.userID}')">
    <td>${user.username}<span class="text-danger ps-1 d-none" id="${user.userID}">!</span></td>
            </tr>
    `;
  }
  ul += `</table>`;
  if (users.length > 0) {
    userTable.innerHTML = ul;
    userTagline.innerHTML = "접속 중인 유저";
    userTagline.classList.remove("text-danger");
    userTagline.classList.add("text-success");
  } else {
    userTagline.innerHTML = "접속 중인 유저 없음";
    userTagline.classList.remove("text-success");
    userTagline.classList.add("text-danger");
  }
});

// 새로고침해도 로컬에 유저가 있다면  보여주기
const sessionUsername = localStorage.getItem("session-username");
const sessionUserID = localStorage.getItem("session-userID");

if (sessionUsername && sessionUserID) {
  socketConnect(sessionUsername, sessionUserID);

  loginContainer.classList.add("d-none");
  chatBody.classList.remove("d-none");
  userTitle.innerHTML = sessionUsername;
}

// 입장한 유저 클릭 시
const setActiveUser = (element, username, userID) => {
  // 유저 클릭 시 상대방 이름에 표시
  title.innerHTML = username;
  // 메시지를 전송할 때 누구에게 보낼지 set해놓고 get하면됨
  title.setAttribute("userID", userID);

  // 사용자 목록 활성 및 비활성 클래스 이벤트 핸들러
  const list = document.getElementsByClassName("socket-users");
  // 유저 클릭 시 색 표시
  for (let i = 0; i < list.length; i++) {
    list[i].classList.remove("table-active");
  }

  element.classList.add("table-active");

  // 사용자 선택 후 메시지 대화 내용 영역 표시
  msgDiv.classList.remove("d-none");
  messages.classList.remove("d-none");
  messages.innerHTML = "";
  // 현재 유저 서버에 보내주기
  socket.emit("fetch-messages", { receiver: userID });
  // 메시지 전송 시 상대방에게 알림 표시
  const notify = document.getElementById(userID);
  notify.classList.add("d-none");
};

// 메시지 전송 시
const msgForm = document.querySelector(".msgForm");
const message = document.getElementById("message");

msgForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const to = title.getAttribute("userID");
  // 지역 현재 시간, hour, minute, 12시간 형식
  const time = new Date().toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  // 메시지 payload 만들기
  const payload = {
    from: socket.id,
    to,
    message: message.value,
    time,
  };
  // 서버에 메시지 payload 전송
  socket.emit("message-to-server", payload);
  // 브라우저에 내용 표시 및 스타일링
  appendMessage({ ...payload, background: "bg-success", position: "right" });

  message.value = "";
  message.focus();
});

socket.on("message-to-client", ({ from, message, time }) => {
  const receiver = title.getAttribute("userID");
  const notify = document.getElementById(from);

  if (receiver === null) {
    notify.classList.remove("d-none");
  } else if (receiver === from) {
    appendMessage({
      message,
      time,
      background: "bg-secondary",
      position: "left",
    });
  } else {
    notify.classList.remove("d-none");
  }
});

// 서버에서 디비에 저장된 메시지 가져오기
socket.on("stored-messages", ({ messages }) => {
  if (messages.length > 0) {
    messages.forEach((msg) => {
      const payload = {
        message: msg.message,
        time: msg.time,
      };
      if (msg.from === socket.id) {
        appendMessage({
          ...payload,
          background: "bg-success",
          position: "right",
        });
      } else {
        appendMessage({
          ...payload,
          background: "bg-secondary",
          position: "left",
        });
      }
    });
  }
});
