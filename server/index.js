/**
 * pong-swoosh server
 *
 */
const port = process.env.PORT || 3000;
const http = require('http').createServer();
http.listen(port);
console.log('Server running on ' + port);

const io = require('socket.io')(http);

const channel = require('./channel');
const channelsFilePath = './channels.json';

const createChannel = require('./create-channel');
const closeChannel = require('./close-channel');
const listChannel = require('./list-channel');
const joinChannel = require('./join-channel');

/**
 * クライアントの接続
 */
io.on('connection', (socket) => {

  /**
   * チャンネル作成イベント
   * @param {string} event.userId - ユーザーID
   * @param {string} event.channelName - チャンネル名
   * @param {function} callback コールバック関数
   */
  socket.once('createChannel', (event, callback) => {
    console.log(`createChannel "${event.channelName}" from ${event.userId}`);
    const created = createChannel(socket, event.userId, event.channelName);
    
    const err = !created ? Error('Channel can not created.') : undefined;
    callback(err, created);

    /**
     * チャンネル削除イベント
     * 
     * 作成イベントを送ったソケットでのみリスニングする
     */
    socket.once('deleteChannel', () => {
      console.log(`deleteChannel "${event.channelName}" from ${event.userId}`);
      closeChannel(io, event.userId, created);
    });

    /**
     * チャンネル切断イベント
     * 
     * 削除と同様の動作を行う
     */
    socket.once('disconnect', () => {
      console.log(`disconnect "${event.channelName}" from ${event.userId}`);
      closeChannel(io, event.userId, created);
    });
  });
  
  /**
   * チャンネル一覧取得イベント
   * @param {string} event.userId - ユーザーID
   * @param {function} callback コールバック関数
   */
  socket.on('listChannel', (event, callback) => {
    const channels = listChannel(event.userId);
    
    callback(channels);
  });

  /**
   * コントローラ接続イベント
   * @param {string} event.userId - ユーザーID
   * @param {string} event.channelId - チャンネルID
   * @param {function} callback コールバック関数
   */
  socket.once('connectController', (event, callback) => {
    const joined = joinChannel(io, socket, 'controller', event.userId, event.channelId);
    const err = !joined ? Error('Channel is not active') : undefined;
    callback(err, [
      // デフォルトのポン一覧
      {}
    ]);

    /**
     * 効果音イベント
     * @param {string} event.id - 効果音ID
     */
    socket.on('pongSwoosh', (event) => {
      // TODO
      // io.in(socket.channel).emit('pongSwoosh', event.id, url, volume);
    });
  });
  
  /**
   * リスナー接続イベント
   * @param {string} event.userId - ユーザーID
   * @param {string} event.channelId - チャンネルID
   * @param {function} callback コールバック関数
   */
  socket.once('connectListener', (event, callback) => {
    const joined = joinChannel(io, socket, 'listener', event.userId, event.channelId);
    const err = !joined ? Error('Channel is not active') : undefined;
    callback(err);
  });

  /**
   * Update connected users
   */
  const updateConnectedUsers = (channel) => {
    const connectedUsers = [];
    const connectedSockets = io.of(channel).sockets;
    console.log('Update connected users: ' + connectedSockets.length);

    /* Update the connected users array depending on the sockets connected in the channel */
    for (let connectedSocket in connectedSockets) {
      connectedUsers.push(connectedSockets[connectedSocket].username);
    }

    // Send connected users array to the clients
    io.in(channel).emit('updateConnectedUsers', connectedUsers);
  };
});
