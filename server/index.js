/**
 * pong-swoosh server
 *
 */
const debug = require('debug')('pong-swoosh');
const fetch = require('node-fetch');
const path = require('path');

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

const pongBaseUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000/pongs'
    : 'https://its-succ.github.io/pong-swoosh/pongs';

const defaultPongs = [
  {
    id: 1,
    title: '拍手',
    url: `${pongBaseUrl}/applause.mp3`,
    duration: 5,
  },
  {
    id: 2,
    title: '納得',
    url: `${pongBaseUrl}/understand.mp3`,
    duration: 2,
  },
  {
    id: 3,
    title: '笑い',
    url: `${pongBaseUrl}/laugh.mp3`,
    duration: 4,
  },
  {
    id: 4,
    title: 'えー(驚き)',
    url: `${pongBaseUrl}/surprise.mp3`,
    duration: 1,
  },
  {
    id: 5,
    title: 'おぉ...(感動)',
    url: `${pongBaseUrl}/wonder.mp3`,
    duration: 2,
  },
  {
    id: 6,
    title: 'ドンドンパフパフ',
    url: `${pongBaseUrl}/dondonpafupafu.mp3`,
    duration: 2,
  },
  {
    id: 7,
    title: 'ドラムロール',
    url: `${pongBaseUrl}/drum-roll.mp3`,
    duration: 4,
  },
  {
    id: 8,
    title: 'ドラ',
    url: `${pongBaseUrl}/gong.mp3`,
    duration: 5,
  },
];

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

    /**
     * チャンネル削除イベント
     *
     * 作成イベントを送ったソケットでのみリスニングする
     */
    socket.once('deleteChannel', async () => {
      await deleteChannel(event, created);
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
    callback(err, defaultPongs);
    if (!joined) return;

    /**
     * 効果音イベント
     * @param {string} event.id - 効果音ID
     */
    socket.on('pongSwoosh', async (event) => {
      try {
        debug('pongSwoosh', event, socket);
        const count = await redis.incr(`${socket.channel}:${event.id}`);
        debug('COUNT', `${socket.channel}:${event.id}`, count);
        const pong = defaultPongs.find((p) => p.id === event.id);
        debug('PONG', pong);
        setTimeout(() => redis.decr(`${socket.channel}:${event.id}`), pong.duration * 1000);
        const listeners = Array.from(io.of('/').in(socket.channel).sockets.values()).filter(
          (s) => s.userrole === 'listener'
        ).length;
        debug('LISTENERS', listeners);
        const volume = Math.sin((Math.PI * 90 * (count / listeners)) / 180) * 2;
        const timestamp = DateTime.now().toFormat('yyyyMMddHHmmss');
        if (!pong.buffer) {
          const response = await fetch(pong.url);
          pong.buffer = await response.arrayBuffer();
        }
        io.in(socket.channel).emit('pongSwoosh', event.id, pong.buffer, volume, timestamp);
      } catch (e) {
        console.error('pongSwoosh', e);
      }
    });

    /**
     * チャンネル切断イベント
     */
    socket.once('disconnect', () => {
      debug(`Controller disconnect "${event.channelName}" from ${event.userId}`);
      socket.leave(socket.channel);
    });
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
    if (callback) callback(err);

    /**
     * チャンネル切断イベント
     */
    socket.once('disconnect', () => {
      debug(`Listener disconnect "${event.channelName}" from ${event.userId}`);
      socket.leave(socket.channel);
    });
  });
});
