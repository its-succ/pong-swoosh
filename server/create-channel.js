const channel = require('./channel');
const { v4: uuidv4 } = require('uuid');

/**
 * チャンネル作成
 *
 * 同一ユーザーで、同一チャンネル名はエラーになる。
 * @param {object} socket - ソケット
 * @param {string} userId - ユーザーID（フィンガープリント）
 * @param {string} channelName -チャンネル名
 * @returns {string} 生成したチャンネルのID
 * @returns {undefined} 生成に失敗したとき
 */
module.exports = (socket, userId, channelName) => {
  if (channel.getChannel(userId, channelName)) {
    console.error('#' + channelName + ' exists.');
    return undefined;
  }
  const channelId = uuidv4();

  channel.addChannel(userId, channelId, channelName);

  socket.join(channelId);
  socket.userrole = 'owner';
  socket.username = userId;
  socket.channel = channelId;
  
  return channelId;
};
