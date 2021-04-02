/**
 * pong-swoosh server
 *
 */
const port = process.env.PORT || 3000;
const cors = require('cors');
const express = require('express');

const app = express();
const server = require('http').Server(app);

const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:5000',
  },
});

const corsOptions = {
  origin: 'http://localhost:5000',
};
app.use(cors(corsOptions));

server.listen(port, () => {
  console.log('Server running on ' + port);
});

const Redis = require('ioredis');

const { DateTime } = require('luxon');

const createChannel = require('./create-channel');
const closeChannel = require('./close-channel');
const listChannel = require('./list-channel');
const joinChannel = require('./join-channel');

const defaultPongs = [
  {
    id: 1,
    title: '拍手',
    url: 'https://soundeffect-lab.info/sound/voice/mp3/people/people-stadium-applause1.mp3',
    duration: 5,
  },
  {
    id: 2,
    title: '歓声',
    url: 'https://soundeffect-lab.info/sound/voice/mp3/people/people-stadium-cheer1.mp3',
    duration: 4,
  },
  {
    id: 3,
    title: '笑い',
    url: 'https://soundeffect-lab.info/sound/voice/mp3/people/people-studio-laugh-large2.mp3',
    duration: 4,
  },
  {
    id: 4,
    title: 'えー',
    url: 'https://soundeffect-lab.info/sound/voice/mp3/people/people-studio-ee1.mp3',
    duration: 1,
  },
  {
    id: 5,
    title: 'おぉ...(感動)',
    url: 'https://soundeffect-lab.info/sound/voice/mp3/line-girl1/line-girl1-oo1.mp3',
    duration: 2,
  },
  {
    id: 6,
    title: 'ドンドンパフパフ',
    url: 'https://soundeffect-lab.info/sound/anime/mp3/dondonpafupafu1.mp3',
    duration: 2,
  },
  {
    id: 7,
    title: 'ドラムロール',
    url: 'https://soundeffect-lab.info/sound/anime/mp3/drum-roll1.mp3',
    duration: 4,
  },
  {
    id: 8,
    title: 'ドラ',
    url: 'https://soundeffect-lab.info/sound/anime/mp3/ban1.mp3',
    duration: 5,
  },
];

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
    callback(err, defaultPongs);

    /**
     * 効果音イベント
     * @param {string} event.id - 効果音ID
     */
    socket.on('pongSwoosh', async (event) => {
      const redis = new Redis(process.env.REDIS_URL);
      const count = redis.incr(`${socket.channel}:${event.id}`);
      const pong = defaultPongs.find((p) => p.id === event.id);
      setTimeout(() => redis.decr(`${socket.channel}:${event.id}`), pong.duration * 1000);
      const listeners = io.of(socket.channel).sockets.filter((s) => s.userrole === 'listener')
        .length;
      const volume = (count / listeners) * 2;
      const timestamp = DateTime.now().toFormat('yyyyMMddHHmmss');
      io.in(socket.channel).emit('pongSwoosh', event.id, volume, timestamp);
    });

    /**
     * チャンネル切断イベント
     */
    socket.once('disconnect', () => {
      console.log(`Controller disconnect "${event.channelName}" from ${event.userId}`);
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
    const joined = joinChannel(io, socket, 'listener', event.userId, event.channelId);
    const err = !joined ? Error('Channel is not active') : undefined;
    callback(err);

    /**
     * チャンネル切断イベント
     */
    socket.once('disconnect', () => {
      console.log(`Controller disconnect "${event.channelName}" from ${event.userId}`);
      socket.leave(socket.channel);
    });
  });
});
