const assert = require('uvu/assert');
const proxyquire = require('proxyquire');
const { createServer } = require('http');
const { io: Client } = require('socket.io-client');
const { Server } = require('socket.io');
const { snoop } = require('snoop');
const { test } = require('uvu');

const removeChannelMock = snoop(() => {});
const closeChannel = proxyquire('../close-channel', {
  './channel': { removeChannel: removeChannelMock.fn },
});

test.before.each(async (context) => {
  await new Promise((resolve) => {
    const httpServer = createServer();
    context.io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      context.clientSocket = new Client(`http://localhost:${port}`);
      context.io.on('connection', (socket) => {
        context.socket = socket;
      });
      context.clientSocket.on('connect', resolve);
    });
  });
});

test.after.each((context) => {
  context.io.close();
  context.clientSocket.close();
});

test('接続しているクライアントが切断されること', (context) => {
  context.socket.join('test.ch');
  context.socket.userrole = 'owner';
  context.socket.username = 'test.user';
  context.socket.channel = 'test.ch';
  const leaveMock = snoop(() => {});
  context.socket.leave = leaveMock.fn;

  closeChannel(context.io, 'test.user', 'test.ch');

  assert.ok(leaveMock.called);
  assert.is(leaveMock.callCount, 1);
  assert.equal(leaveMock.calls[0].arguments, ['test.ch']);

  assert.ok(removeChannelMock.called);
  assert.is(removeChannelMock.callCount, 1);
  assert.equal(removeChannelMock.calls[0].arguments, ['test.user', 'test.ch']);
});

test.run();
