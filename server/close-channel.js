/**
 * チャンネル終了
 *
 * 同一ユーザーで、同一チャンネル名はエラーになる。
 * @param {object} io - socket.io オブジェクト
 * @param {string} userId - ユーザーID（フィンガープリント）
 * @param {string} channelId -チャンネルID
 */
module.exports = (io, userId, channelId) => {
  const connectedSockets = io.of(channelId).sockets;
  connectedSockets.each((socket) => socket.leave(socket.channel));
};
