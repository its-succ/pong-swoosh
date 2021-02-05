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

io.on('connection', (socket) => {
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
