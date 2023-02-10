/**
 * pong-swoosh server
 *
 */
const debug = require('debug')('pong-swoosh');

const port = process.env.PORT || 3000;
const server = require('http').createServer();

const io = require('socket.io')(server, {
  cors: {
    origin: ['http://localhost:5000', 'https://its-succ.github.io'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

server.listen(port, () => {
  console.log('Server running on ' + port);
});

const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const { DateTime } = require('luxon');

const createChannel = require('./create-channel');
const closeChannel = require('./close-channel');
const listChannel = require('./list-channel');
const joinChannel = require('./join-channel');
const { updateChannel, findCustomButtonIdsById } = require('./channel');
const { getAllPongs, getChannelPongs } = require('./pongs');

const pongBaseUrl = ['development', 'test'].includes(process.env.NODE_ENV)
  ? 'http://localhost:5000/pongs'
  : 'https://its-succ.github.io/pong-swoosh/pongs';

/**
 * チャンネルを削除する
 * @param {any} event - イベント
 * @param {string} channelId - チャンネルID
 */
const deleteChannel = async (event, channelId) => {
  debug(`deleteChannel "${event.channelName}" from ${event.userId}`);
  try {
    closeChannel(io, event.userId, channelId);
    const keys = await redis.keys(`${channelId}:*`);
    const pipeline = redis.pipeline();
    keys.forEach((key) => pipeline.del(key));
    pipeline.exec();
  } catch (e) {
    console.error('deleteChannel', e);
  }
};

const emitLatestParticipants = (socket) => {
  debug('emitLatestParticipants');
  const listeners = Array.from(io.of('/').in(socket.channel).sockets.values()).filter(
    (s) => s.userrole === 'listener'
  ).length;
  io.in(socket.channel).emit('latestParticipants', listeners);
};

/**
 * クライアントの接続
 */
io.on('connection', (socket) => {
  /**
   * チャンネル作成イベント
   * @param {string} event.userId - ユーザーID
   * @param {string} event.channelName - チャンネル名
   * @param {string} event.channelId - チャンネルID。再接続する場合のみ指定される
   * @param {function} callback コールバック関数
   */
  socket.once('createChannel', (event, callback) => {
    debug(`createChannel "${event.channelName}" from ${event.userId}`);
    const created = createChannel(socket, event.userId, event.channelName, event.channelId);

    const err = !created ? Error('Channel can not created.') : undefined;
    callback(err, created);

    if (
      err === undefined &&
      event.selectedButtons instanceof Array &&
      event.selectedButtons.length > 0
    ) {
      // 再接続の場合は、イベントにselectedButtonsが指定されてくるので、チャンネルをアップデートする
      updateChannel(event.userId, created, event.selectedButtons);
    }

    /**
     * チャンネル削除イベント
     *
     * 作成イベントを送ったソケットでのみリスニングする
     */
    socket.once('deleteChannel', async (callback) => {
      await deleteChannel(event, created);
      if (callback) callback();
    });

    /**
     * 利用可能なボタン一覧取得イベント
     */
    socket.on('allButtons', async (callback) => {
      callback(getAllPongs(pongBaseUrl));
    });

    /**
     * カスタマイズしたボタン一覧を保存するイベント
     */
    socket.on('saveCustomButtons', async ({ buttonIds }, callback) => {
      debug(`saveCustomButtons "${buttonIds}" from ${event.userId}`);
      try {
        updateChannel(event.userId, created, buttonIds);
        if (callback) callback();
      } catch (e) {
        console.error('saveCustomButtons', e);
        if (callback) callback(e);
      }
    });

    /**
     * チャンネル切断イベント
     *
     * 削除と同様の動作を行う
     */
    socket.on('disconnect', () => {
      debug(`disconnect "${event.channelName}" from ${event.userId}`);
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
    debug('connectController', event);
    const joined = joinChannel(io, socket, 'controller', event.userId, event.channelId);
    debug('joinChannel', joined);
    const err = !joined ? Error('Channel is not active') : undefined;
    callback(err, getChannelPongs(pongBaseUrl, findCustomButtonIdsById(event.channelId)));
    if (!joined) return;

    /**
     * チャンネル切断イベント
     */
    socket.once('disconnect', () => {
      debug(`Controller disconnect "${event.channelName}" from ${event.userId}`);
      socket.leave(socket.channel);
    });
  });

  /**
   * 効果音イベント
   * @param {string} event.id - 効果音ID
   */
  socket.on('pongSwoosh', async (event) => {
    try {
      debug('pongSwoosh', event, socket);
      const count = await redis.incr(`${socket.channel}:${event.id}`);
      debug('COUNT', `${socket.channel}:${event.id}`, count);
      const pong = getAllPongs(pongBaseUrl).find((p) => p.id === event.id);
      debug('PONG', pong);
      setTimeout(() => redis.decr(`${socket.channel}:${event.id}`), pong.duration * 1000);
      const listeners = Array.from(io.of('/').in(socket.channel).sockets.values()).filter(
        (s) => s.userrole === 'listener'
      ).length;
      debug('LISTENERS', listeners);
      const volume = Math.sin((Math.PI * 90 * (count / listeners)) / 180);
      const timestamp = DateTime.now().toFormat('yyyyMMddHHmmss');
      io.in(socket.channel).emit('pongSwoosh', event.id, volume, timestamp);
    } catch (e) {
      console.error('pongSwoosh', e);
    }
  });

  /**
   * リスナー接続イベント
   * @param {string} event.userId - ユーザーID
   * @param {string} event.channelId - チャンネルID
   * @param {function} callback コールバック関数
   */
  socket.once('connectListener', (event, callback) => {
    debug('connectListener', event);
    const joined = joinChannel(io, socket, 'listener', event.userId, event.channelId);
    debug('joinChannel', joined);
    const err = !joined ? Error('Channel is not active') : undefined;
    if (callback) {
      callback(err, getChannelPongs(pongBaseUrl, findCustomButtonIdsById(event.channelId)));
    }

    emitLatestParticipants(socket);

    /**
     * チャンネル切断イベント
     */
    socket.once('disconnect', () => {
      debug(`Listener disconnect "${event.channelName}" from ${event.userId}`);
      socket.leave(socket.channel);
      emitLatestParticipants(socket);
    });
  });
});
