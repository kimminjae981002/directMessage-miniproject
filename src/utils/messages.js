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
    );

    console.log("메시지 전송");
  } catch (error) {
    console.error("메시지 전송 중 오류 발생:", error);
  }
};

module.exports = { saveMessages };
