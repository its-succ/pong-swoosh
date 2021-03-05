/**
 * チャンネル参加
 *
 * チャンネルに作成者が残っている場合に参加できる。
 * @param {object} io - ソケットIO
 * @param {object} socket - ソケット
 * @param {string} userRole - ユーザー権限
 * @param {string} userId - ユーザーID（フィンガープリント）
 * @param {string} channelId -チャンネルID
 * @returns {boolean} 接続に成功したかどうか
 */
module.exports = (io, socket, userRole, userId, channelId) => {
  const connectedSockets = io.of(channelId).sockets;
  if (connectedSockets.findIndex((s) => s.userrole === 'owner') < 0) {
    console.error('#' + channelId + ' was closed.');
    return undefined;
  }

  socket.join(channelId);
  socket.userrole = userRole;
  socket.username = userId;
  socket.channel = channelId;

  return true;
};
