const assert = require('uvu/assert');
const proxyquire = require('proxyquire');
const { createServer } = require('http');
const { faker } = require('@faker-js/faker');
const { io: Client } = require('socket.io-client');
const { Server } = require('socket.io');
const { snoop } = require('snoop');
const { test } = require('uvu');

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

test('同一ユーザーで、同一チャンネル名で、再接続でない場合はエラーになること', (context) => {
  const getChannelMock = snoop(() => true); // 同一チャンネルが存在している場合
  const addChannelMock = snoop(() => {});
  const createChannel = proxyquire('../create-channel', {
    './channel': {
      getChannel: getChannelMock.fn,
      addChannel: addChannelMock.fn,
    },
  });
  const result = createChannel(context.socket, 'test', 'test.ch');
  assert.equal(result, undefined);
});

test('まだ作成されていないチャンネルの場合は、チャンネル追加されてソケットにオーナー登録されること', (context) => {
  const getChannelMock = snoop(() => false); // 存在しないチャンネル
  const addChannelMock = snoop(() => {});
  const channelId = faker.datatype.uuid();
  const createChannel = proxyquire('../create-channel', {
    './channel': {
      getChannel: getChannelMock.fn,
      addChannel: addChannelMock.fn,
    },
    'uuid': {
      v4: () => channelId,
    },
  });
  const result = createChannel(context.socket, 'test', 'test.ch');

  assert.ok(addChannelMock.called);
  assert.is(addChannelMock.callCount, 1);
  assert.equal(addChannelMock.calls[0].arguments, ['test', channelId, 'test.ch']);

  const sockets = Array.from(context.io.of('/').in(channelId).sockets.values());
  assert.equal(sockets.length, 1);
  assert.equal(sockets[0].userrole, 'owner');
  assert.equal(sockets[0].username, 'test');
  assert.equal(sockets[0].channel, channelId);
  assert.equal(result, channelId);
});

test('再接続の場合は、チャンネル追加されずにソケットにオーナー登録されること', (context) => {
  const getChannelMock = snoop(() => true); // 存在するチャンネル
  const addChannelMock = snoop(() => {});
  const channelId = faker.datatype.uuid();
  const createChannel = proxyquire('../create-channel', {
    './channel': {
      getChannel: getChannelMock.fn,
      addChannel: addChannelMock.fn,
    },
  });
  const result = createChannel(context.socket, 'test', 'test.ch', channelId);

  assert.not(addChannelMock.called);

  const sockets = Array.from(context.io.of('/').in(channelId).sockets.values());
  assert.equal(sockets.length, 1);
  assert.equal(sockets[0].userrole, 'owner');
  assert.equal(sockets[0].username, 'test');
  assert.equal(sockets[0].channel, channelId);
  assert.equal(result, channelId);
});

test.run();
