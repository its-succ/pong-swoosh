const channel = require('./channel');

/**
 * チャンネル一覧取得
 *
 * 指定したユーザーが作成したチャンネル一覧を取得する
 * @param {string} userId - ユーザーID（フィンガープリント）
 * @returns {array} チャンネル一覧
 */
module.exports = (userId) => {
  if (channel.getChannel(userId, channelName)) {
    console.error('#' + channelName + ' exists.');
    return undefined;
  }
  return channelId;
};
