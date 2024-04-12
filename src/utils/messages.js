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
        $push: { messages: data },
      }
    ),
      console.log("메시지 전송");
  } catch (error) {
    console.error("메시지 전송 중 오류 발생:", error);
  }
};

const fetchMessages = async (io, sender, receiver) => {
  try {
    const token = getToken(sender, receiver);
    // 디비에서 토큰에 해당하는 메시지를 찾음
    const foundToken = await messageModel.findOne({ userToken: token });

    if (foundToken) {
      // 메시지를 찾았을 경우 클라이언트에게 메시지 전송
      io.to(sender).emit("stored-messages", { messages: foundToken.messages });
    } else {
      // 토큰에 해당하는 메시지가 없을 경우 새로운 메시지 생성
      const data = {
        userToken: token,
        messages: [],
      };
      const newMessage = new messageModel(data);
      await newMessage.save();
      console.log("새로운 메시지 생성");
    }
  } catch (error) {
    console.error("메시지 가져오기 중 오류 발생:", error);
  }
};

module.exports = { saveMessages, fetchMessages };
