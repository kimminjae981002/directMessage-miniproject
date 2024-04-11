const mongoose = require("mongoose");

// 메시지 스키마
const messageSchema = mongoose.Schema({
  // A USER와 B USER의 아이디를 합쳐서 만든 토큰 따로 로직이 존재한다.
  userToken: {
    type: String,
    required: true,
  },
  // 메시지
  // 뭐라 보냇고 뭐라 왔는지가 messages에 들어간다.
  messages: [
    {
      // 누구에게 왔는지
      from: {
        type: String,
        required: true,
      },
      // 무슨 내용인지
      message: {
        type: String,
        required: true,
      },
      // 작성한 시간
      time: {
        type: String,
        required: true,
      },
    },
  ],
});

const messageModel = mongoose.model("Message", messageSchema);
module.exports = messageModel;
