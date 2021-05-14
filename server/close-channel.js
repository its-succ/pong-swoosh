/**
 * チャンネル終了
 *
 * @param {object} io - socket.io オブジェクト
 * @param {string} userId - ユーザーID（フィンガープリント）
 * @param {string} channelId -チャンネルID
 */
module.exports = (io, userId, channelId) => {
  const connectedSockets = Array.from(io.of('/').in(channelId).sockets.values());
  if (typeof connectedSockets.each === 'function')
    connectedSockets.each((socket) => socket.leave(socket.channel));
};
