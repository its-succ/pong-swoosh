const channel = require('./channel');
const { v4: uuidv4 } = require('uuid');

/**
 * チャンネル作成
 *
 * 同一ユーザーで、同一チャンネル名はエラーになる。
 * @param {object} socket - ソケット
 * @param {string} userId - ユーザーID（フィンガープリント）
 * @param {string} channelName -チャンネル名
 * @param {string} channelId - チャンネルID。再接続する場合のみ指定される
 * @returns {string} 生成したチャンネルのID（再接続のときは指定されたIDがそのまま戻る）
 * @returns {undefined} 生成に失敗したとき
 */
module.exports = async (socket, userId, channelName, channelId) => {
  const exists = await channel.getChannel(userId, channelName);
  if (exists && !channelId) {
    console.error('#' + channelName + ' exists.');
    return undefined;
  }
  channelId = channelId ? channelId : uuidv4();

  if (!exists) {
    await channel.addChannel(userId, channelId, channelName);
  }

  socket.join(channelId);
  socket.userrole = 'owner';
  socket.username = userId;
  socket.channel = channelId;

  return channelId;
};
