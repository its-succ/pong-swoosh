const assert = require('uvu/assert');
const proxyquire = require('proxyquire');
const { createServer } = require('http');
const { io: Client } = require('socket.io-client');
const { snoop } = require('snoop');
const { test } = require('uvu');
const RedisMock = require('ioredis-mock');
const createChannel = require('../create-channel');
const closeChannel = require('../close-channel');
const joinChannel = require('../join-channel');
const { faker } = require('@faker-js/faker');
const { updateChannel, findCustomButtonIdsById } = require('../channel');

const httpServer = createServer();

// モックの準備
// モックが設定されていた場合は、モック関数を利用し、そうでない場合は、デフォルト実装を呼び出すようにする
let createChannelMock = undefined;
let closeChannelMock = undefined;
let joinChannelMock = undefined;
let updateChannelMock = undefined;
let findCustomButtonIdsByIdMock = undefined;

const createChannelProxy = (...args) =>
  createChannelMock ? createChannelMock.fn(...args) : createChannel(...args);
const closeChannelProxy = (...args) =>
  closeChannelMock ? closeChannelMock.fn(...args) : closeChannel(...args);
const joinChannelProxy = (...args) =>
  joinChannelMock ? joinChannelMock.fn(...args) : joinChannel(...args);
const updateChannelProxy = (...args) =>
  updateChannelMock ? updateChannelMock.fn(...args) : updateChannel(...args);
const findCustomButtonIdsByIdProxy = (...args) =>
  findCustomButtonIdsByIdMock
    ? findCustomButtonIdsByIdMock.fn(...args)
    : findCustomButtonIdsById(...args);

// テストの最初に index.js を呼び出してサーバーを起動しておく
test.before(() => {
  proxyquire('../index', {
    './create-channel': createChannelProxy,
    './close-channel': closeChannelProxy,
    './join-channel': joinChannelProxy,
    './channel': {
      updateChannel: updateChannelProxy,
      findCustomButtonIdsById: findCustomButtonIdsByIdProxy,
    },
    'ioredis': RedisMock,
    'http': { createServer: () => httpServer },
  });
});

// テストごとにクライアントから接続して、モックをクリアする
test.before.each(async (context) => {
  await new Promise((resolve) => {
    context.clientSocket = new Client(`http://localhost:3000`);
    context.clientSocket.on('connect', resolve);
  });
  createChannelMock = undefined;
  closeChannelMock = undefined;
  joinChannelMock = undefined;
  updateChannelMock = undefined;
  findCustomButtonIdsByIdMock = undefined;
});

// テストごとにクライアント接続を切断する
test.after.each((context) => {
  context.clientSocket.close();
});

// テストの最後にサーバーを終了する
test.after(() => {
  httpServer.close();
});

test('チャンネル作成が成功すると、コールバックにチャンネルIDが渡されること', async (context) => {
  const userId = 'test.index.create.user';
  const channelName = 'test.index.create.ch';
  const channelId = faker.datatype.uuid();
  createChannelMock = snoop(() => channelId);

  const result = await new Promise((resolve, reject) => {
    context.clientSocket.emit('createChannel', { userId, channelName }, (err, id) => {
      if (err) {
        return reject(err);
      }
      resolve(id);
    });
  });
  assert.equal(result, channelId);
  assert.ok(createChannelMock.called);
  assert.is(createChannelMock.callCount, 1);
  assert.equal(createChannelMock.calls[0].arguments.splice(1), [userId, channelName, undefined]);
});

test('チャンネル作成が失敗すると、コールバックにエラーが渡されること', async (context) => {
  const userId = 'test.index.create.user';
  const channelName = 'test.index.create.ch';
  createChannelMock = snoop(() => undefined);

  try {
    await new Promise((resolve, reject) => {
      context.clientSocket.emit('createChannel', { userId, channelName }, (err, id) => {
        if (err) {
          return reject(err);
        }
        resolve(id);
      });
    });
    assert.not.ok(true, 'エラーにならなかった');
  } catch (e) {
    assert.ok(e, 'エラーになること');
  }
});

test('作成済みのチャンネルのボタンをカスタマイズできること', async (context) => {
  const userId = 'test.index.create.user';
  const channelName = 'test.index.create.ch';
  const channelId = faker.datatype.uuid();
  const buttonIds = [1, 3, 7];
  createChannelMock = snoop(() => channelId);
  updateChannelMock = snoop(() => {});

  await new Promise((resolve, reject) => {
    context.clientSocket.emit('createChannel', { userId, channelName }, (err, id) => {
      if (err) {
        return reject(err);
      }
      context.clientSocket.emit('saveCustomButtons', { buttonIds }, () => resolve(id));
    });
  });
  assert.ok(createChannelMock.called, 'チャンネル作成がよばれること');
  assert.ok(updateChannelMock.called, 'チャンネル更新がよばれること');
  assert.is(updateChannelMock.callCount, 1);
  assert.equal(updateChannelMock.calls[0].arguments, [userId, channelId, buttonIds]);
});

test('作成済みのチャンネルを閉じれること', async (context) => {
  const userId = 'test.index.create.user';
  const channelName = 'test.index.create.ch';
  const channelId = faker.datatype.uuid();
  createChannelMock = snoop(() => channelId);
  closeChannelMock = snoop(() => {});

  await new Promise((resolve, reject) => {
    context.clientSocket.emit('createChannel', { userId, channelName }, (err, id) => {
      if (err) {
        return reject(err);
      }
      context.clientSocket.emit('deleteChannel', () => resolve(id));
    });
  });
  assert.ok(createChannelMock.called, 'チャンネル作成がよばれること');
  assert.ok(closeChannelMock.called, 'チャンネル終了がよばれること');
  assert.is(closeChannelMock.callCount, 1);
  assert.equal(closeChannelMock.calls[0].arguments.splice(1), [userId, channelId]);
});

test('コントローラが接続できること', async (context) => {
  const userId = 'test.index.controller.user';
  const channelId = faker.datatype.uuid();
  joinChannelMock = snoop(() => true);
  findCustomButtonIdsByIdMock = snoop(() => undefined);

  const defaultPongs = await new Promise((resolve, reject) => {
    context.clientSocket.emit('connectController', { userId, channelId }, (err, defaultPongs) => {
      if (err) {
        return reject(err);
      }
      resolve(defaultPongs);
    });
  });
  assert.ok(joinChannelMock.called, 'チャンネル参加がよばれること');
  assert.is(joinChannelMock.callCount, 1);
  assert.equal(joinChannelMock.calls[0].arguments.splice(2), ['controller', userId, channelId]);
  assert.equal(defaultPongs.length, 8, 'デフォルトの効果音が8個取得できること');
});

test('コントローラが接続したときカスタムボタンが設定されているときは、それが戻ること', async (context) => {
  const userId = 'test.index.controller.user';
  const channelId = faker.datatype.uuid();
  joinChannelMock = snoop(() => true);
  findCustomButtonIdsByIdMock = snoop(() => [1, 3, 5, 6]);

  const defaultPongs = await new Promise((resolve, reject) => {
    context.clientSocket.emit('connectController', { userId, channelId }, (err, defaultPongs) => {
      if (err) {
        return reject(err);
      }
      resolve(defaultPongs);
    });
  });
  assert.ok(joinChannelMock.called, 'チャンネル参加がよばれること');
  assert.is(joinChannelMock.callCount, 1);
  assert.equal(joinChannelMock.calls[0].arguments.splice(2), ['controller', userId, channelId]);
  assert.equal(defaultPongs.length, 4, 'カスタムボタンに設定した数だけ取得できること');
});

test('コントローラが接続できないときは、エラーが戻ること', async (context) => {
  const userId = 'test.index.controller.user';
  const channelId = faker.datatype.uuid();
  joinChannelMock = snoop(() => false);
  findCustomButtonIdsByIdMock = snoop(() => undefined);

  const err = await new Promise((resolve, reject) => {
    context.clientSocket.emit('connectController', { userId, channelId }, (err) => {
      if (err) {
        return resolve(err);
      }
      reject();
    });
  });
  assert.ok(err);
});

test('リスナーが接続できること', async (context) => {
  const userId = 'test.index.listener.user';
  const channelId = faker.datatype.uuid();
  joinChannelMock = snoop(() => true);
  findCustomButtonIdsByIdMock = snoop(() => undefined);

  const defaultPongs = await new Promise((resolve, reject) => {
    context.clientSocket.emit('connectListener', { userId, channelId }, (err, defaultPongs) => {
      if (err) {
        return reject(err);
      }
      resolve(defaultPongs);
    });
  });
  assert.ok(joinChannelMock.called, 'チャンネル参加がよばれること');
  assert.is(joinChannelMock.callCount, 1);
  assert.equal(joinChannelMock.calls[0].arguments.splice(2), ['listener', userId, channelId]);
  assert.equal(defaultPongs.length, 8, 'デフォルトの効果音が8個取得できること');
});

test('リスナーが接続したときカスタムボタンが設定されているときは、それが戻ること', async (context) => {
  const userId = 'test.index.listener.user';
  const channelId = faker.datatype.uuid();
  joinChannelMock = snoop(() => true);
  findCustomButtonIdsByIdMock = snoop(() => [1, 3, 5, 6]);

  const defaultPongs = await new Promise((resolve, reject) => {
    context.clientSocket.emit('connectListener', { userId, channelId }, (err, defaultPongs) => {
      if (err) {
        return reject(err);
      }
      resolve(defaultPongs);
    });
  });
  assert.ok(joinChannelMock.called, 'チャンネル参加がよばれること');
  assert.is(joinChannelMock.callCount, 1);
  assert.equal(joinChannelMock.calls[0].arguments.splice(2), ['listener', userId, channelId]);
  assert.equal(defaultPongs.length, 4, 'デフォルトの効果音が8個取得できること');
});

test('リスナーが接続できないときは、エラーが戻ること', async (context) => {
  const userId = 'test.index.listener.user';
  const channelId = faker.datatype.uuid();
  joinChannelMock = snoop(() => false);
  findCustomButtonIdsByIdMock = snoop(() => undefined);

  const err = await new Promise((resolve, reject) => {
    context.clientSocket.emit('connectListener', { userId, channelId }, (err) => {
      if (err) {
        return resolve(err);
      }
      reject();
    });
  });
  assert.ok(err);
});

test('リスナー接続したとき、参加者が通知されること', async (context) => {
  const ownerId = 'test.index.owner.user';
  const channelName = 'test.index.listeners.ch';
  const listenerIds = [
    'test.index.listener.user.1',
    'test.index.listener.user.2',
    'test.index.listener.user.3',
  ];
  // リスナーの数分ソケットを用意する
  const listenerSockets = await new Promise((resolve) =>
    resolve([
      new Client(`http://localhost:3000`),
      new Client(`http://localhost:3000`),
      new Client(`http://localhost:3000`),
    ])
  );

  const nums = [];
  listenerSockets[0].on('latestParticipants', (num) => {
    nums.push(num);
  });

  const channelId = await new Promise((resolve, reject) => {
    context.clientSocket.emit('createChannel', { userId: ownerId, channelName }, (err, id) => {
      if (err) {
        return reject(err);
      }
      resolve(id);
    });
  });
  for (let i = 0; i < listenerIds.length; i++) {
    await new Promise((resolve, reject) => {
      listenerSockets[i].emit(
        'connectListener',
        { userId: listenerIds[i], channelId },
        (err, defaultPongs) => {
          if (err) {
            return reject(err);
          }
          resolve(defaultPongs);
        }
      );
    });
  }
  // latestParticipants イベントの到着を少し待つ
  await new Promise((resolve) => setTimeout(resolve, 500));
  assert.equal(nums, [1, 2, 3]);
  // 切断すると、人数が減るイベントが飛ぶ
  listenerSockets[2].close();
  // latestParticipants イベントの到着を少し待つ
  await new Promise((resolve) => setTimeout(resolve, 500));
  assert.equal(nums, [1, 2, 3, 2]);
  listenerSockets[1].close();
  listenerSockets[0].close();
  // チャンネルを削除する
  await new Promise((resolve) => context.clientSocket.emit('deleteChannel', () => resolve()));
});

test.run();
