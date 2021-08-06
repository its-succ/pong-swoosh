const channel = require('./channel');
const debug = require('debug')('pong-swoosh');

/**
 * チャンネル終了
 *
 * @param {object} io - socket.io オブジェクト
 * @param {string} userId - ユーザーID（フィンガープリント）
 * @param {string} channelId -チャンネルID
 */
module.exports = (io, userId, channelId) => {
  const connectedSockets = Array.from(io.of('/').in(channelId).sockets.values());
  if (typeof connectedSockets.each === 'function') {
    connectedSockets.each((socket) => {
      debug(`Leave from ${socket.channel} ${socket.username}@${socket.userrole}`);
      socket.leave(socket.channel);
    });
  } else {
    console.error('connectedSockets.each not function');
  }
  channel.removeChannel(userId, channelId);
};
