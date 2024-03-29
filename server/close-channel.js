const channel = require('./channel');
const debug = require('debug')('pong-swoosh');

/**
 * チャンネル終了
 *
 * @param {object} io - socket.io オブジェクト
 * @param {string} userId - ユーザーID（フィンガープリント）
 * @param {string} channelId -チャンネルID
 */
module.exports = async (io, userId, channelId) => {
  const connectedSockets = await io.of('/').in(channelId).fetchSockets();
  connectedSockets.forEach((socket) => {
    debug(`Leave from ${socket.channel} ${socket.username}@${socket.userrole}`);
    socket.leave(socket.channel);
  });
  await channel.removeChannel(userId, channelId);
};
