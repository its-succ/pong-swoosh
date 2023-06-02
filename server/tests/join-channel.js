const assert = require('uvu/assert');
const joinChannel = require('../join-channel');
const { createServer } = require('http');
const { faker } = require('@faker-js/faker');
const { io: Client } = require('socket.io-client');
const { Server } = require('socket.io');
const { test } = require('uvu');

test.before.each(async (context) => {
  let port;
  await new Promise((resolve) => {
    const httpServer = createServer();
    context.io = new Server(httpServer);
    httpServer.listen(() => {
      port = httpServer.address().port;
      context.ownerClientSocket = new Client(`http://localhost:${port}`);
      context.io.on('connection', (socket) => {
        context.socket = socket;
      });
      context.ownerClientSocket.on('connect', resolve);
    });
  });
  await new Promise((resolve) => {
    context.ownerSocket = context.socket;
    context.listenerClientSocket = new Client(`http://localhost:${port}`);
    context.listenerClientSocket.on('connect', resolve);
  });
});

test.after.each((context) => {
  context.io.close();
  context.ownerClientSocket.close();
  context.listenerClientSocket.close();
});

test('参加するチャンネルにオーナーが存在しない場合は参加できない', async (context) => {
  const channelId = faker.string.uuid();
  const result = await joinChannel(context.io, context.socket, 'listener', 'test', channelId);
  assert.equal(result, undefined);
});

test('オーナーが参加しているチャンネルに参加できること', async (context) => {
  const channelId = faker.string.uuid();
  context.ownerSocket.join(channelId);
  context.ownerSocket.userrole = 'owner';
  context.ownerSocket.username = 'test.owner';
  context.ownerSocket.channel = channelId;

  const result = await joinChannel(
    context.io,
    context.socket,
    'listener',
    'test.listener',
    channelId
  );
  assert.equal(result, true);

  const sockets = await context.io.of('/').in(channelId).fetchSockets();
  assert.equal(sockets.length, 2);
  assert.equal(sockets[0].userrole, 'owner');
  assert.equal(sockets[0].username, 'test.owner');
  assert.equal(sockets[0].channel, channelId);
  assert.equal(sockets[1].userrole, 'listener');
  assert.equal(sockets[1].username, 'test.listener');
  assert.equal(sockets[1].channel, channelId);
});

test.run();
