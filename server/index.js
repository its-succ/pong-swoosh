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
   * Sign in
   */
  socket.on('signIn', (signInfos) => {
    const channelName = signInfos.channelName;
    const userName = signInfos.userName;

    console.log('Sign in attempt : ' + userName + ' in #' + channelName);

    // Creates the channel if it doesn't exist
    if (!channel.getChannel(channelsFilePath, channelName)) {
      console.log('#' + channelName + ' does not exist.');
      channel.addChannel(channelsFilePath, channelName);
    }

    socket.join(channelName);
    console.log(userName + ' joined #' + channelName);
    socket.username = userName;
    socket.channel = channelName;
    io.in(socket.channel).emit('userSignedIn', userName, channelName);
    updateConnectedUsers(socket.channel);
  });

  /**
   * Send chat message
   */
  socket.on('sendMessage', (message) => {
    io.in(socket.channel).emit('sendMessageToClients', socket.username, message);
  });

  /**
   * Client disconnect
   */
  socket.on('disconnect', () => {
    io.in(socket.channel).emit('clientDisco', socket.username);
    socket.leave(socket.channel);
    updateConnectedUsers(socket.channel);
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
