const messageModel = require("../models/messages.model");

// 수신자와 송신자 합 판별
const getToken = (sender, receiver) => {
  const key = [sender, receiver].sort().join("");
  return key;
};

// message온 것들을 저장
const saveMessages = async ({ from, to, message, time }) => {
  try {
    const token = getToken(from, to);
    const data = {
      from,
      message,
      time,
    };

    // await를 사용하여 updateOne 메서드가 Promise를 반환하도록 변경
    // 수신자와 송신자 합 key를 이용함. db에 내용 저장
    await messageModel.updateOne(
      { userToken: token },
      {
        $push: { message: data },
      }
    ),
      console.log("메시지 전송");
  } catch (error) {
    console.error("메시지 전송 중 오류 발생:", error);
  }
};

// db에서 메시지 가져오기
const fetchMessages = async (io, sender, receiver) => {
  const token = getToken(sender, receiver);
  // 연락한 내용이 있다면 메시지를 보내주고 없다면 새로운 메시지를 만든다.
  const foundToken = await messageModel.findOne({ userToken: token });
  if (foundToken) {
    io.to(sender).emit("stored-mesasges", { messages: foundToken.messages });
  } else {
    const data = {
      userToken: token,
      messages: [],
    };
    const message = new messageModel(data);
    const savedMessage = message.save();
    if (savedMessage) {
      console.log("메시지 생성");
    } else {
      console.log("메시지 에러");
    }
  }
};

module.exports = { saveMessages, fetchMessages };
