// 서버 socket과 연동하는 부분
const socket = io("http://localhost:3000", {
  autoConnect: false, // 서버에 접속할 때 socket가 바로 연결하는 게 아닌 따로 connect 함수를 작성
  // 로그인하고 연결을 해야하기 때문에
});

// socket이 통신을 할 때마다 어떤 이벤트나 args가 컨솔에 찍을 수 있게 개발할 때 편하다.
socket.onAny((event, ...args) => {
  console.log(event, args);
});
