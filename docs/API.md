# API 仕様

## チャンネルオーナー向け

チャンネルオーナーとは、最初にチャンネルを作成するユーザーと。チャンネル所有者をさします。

### チャンネル作成

新しいチャンネルを作成する。

#### イベント名

createChannel

#### ペイロード

| 項目名 | 内容         |
|-------|-------------|
| userId | ユーザーID   |
| channelName | 開設するチャンネル名 |
| channelId | WebSocketのセッションが切断してしまったとき、作成したチャンネルに再接続する場合に指定するチャンネルID。新規作成の場合は指定しない |

#### コールバック関数

> func( err,channelId )

| 項目名 | 内容         |
|-------|-------------|
| err   | チャンネル作成エラーが発生した場合に Error オブジェクトが設定される。エラーでなければ undefined が戻る。 |
| channelId | 作成したチャンネルID。再接続するときに利用できる |

#### コード例

```JavaScript
  socket.emit('createChannel', { userId, channelName }, (err, id) => {
    if (err) {
      return;
    }
    channelId = id;
  });
```

### チャンネル削除

接続しているソケットで作成したチャンネルを削除する。
チャンネルを削除しないと一度作成したチャンネル名での作成が失敗する場合があります。
`createChannel` を呼び出したソケット以外からのイベント呼び出しは受け付けられません。

#### イベント名

deleteChannel

#### ペイロード

パラメータ指定なし

#### コールバック関数

> func( )

コールバック関数を指定すると、チャンネル削除後に呼び出されます。

#### コード例

```JavaScript
  socket.emit('deleteChannel');
```

## チャンネル参加者向け

チャンネル参加者とは、チャンネルオーナーが開設したチャンネルに参加するユーザー。

### リスナー接続

効果音送信/受信の両方が利用できるクライアント接続

#### イベント名

connectListener

#### ペイロード

| 項目名 | 内容         |
|-------|-------------|
| userId | ユーザーID   |
| channelId | チャンネルオーナーが作成したチャンネルのID |

#### コールバック関数

> func( err, defaultPongs )

| 項目名 | 内容         |
|-------|-------------|
| err   | 接続エラーが発生した場合に Error オブジェクトが設定される。エラーでなければ undefined が戻る。 |
| defaultPongs | 効果音セット |

効果音セットの例

```JavaScript
[
  {
    id: 1,
    title: '拍手',
    url: 'https://example.com/pongs/applause.mp3',
    icon: 'https://example.com/pongs/applause.svg',
    duration: 5,
  },
  {
    id: 2,
    title: '納得',
    url: 'https://example.com/pongs/understand.mp3',
    icon: 'https://example.com/pongs/understand.svg',
    duration: 2,
  }
];
```

#### コード例

```JavaScript
    socket.emit('connectListener', { userId: visitorId, channelId: channelSlug },
        (err, value) => {
        if (err) {
            error(err);
            return;
        }
        pongActions = value;
        }
    );
```

### コントローラ接続

効果音送信用のクライアント接続。送信用クライアントは参加者の人数に含まれません。

#### イベント名

connectController

#### ペイロード

| 項目名 | 内容         |
|-------|-------------|
| userId | ユーザーID   |
| channelId | チャンネルオーナーが作成したチャンネルのID |

#### コールバック関数

> func( err, defaultPongs )

| 項目名 | 内容         |
|-------|-------------|
| err   | 接続エラーが発生した場合に Error オブジェクトが設定される。エラーでなければ undefined が戻る。 |
| defaultPongs | 効果音セット |

効果音セットの例

```JavaScript
[
  {
    id: 1,
    title: '拍手',
    url: 'https://example.com/pongs/applause.mp3',
    icon: 'https://example.com/pongs/applause.svg',
    duration: 5,
  },
  {
    id: 2,
    title: '納得',
    url: 'https://example.com/pongs/understand.mp3',
    icon: 'https://example.com/pongs/understand.svg',
    duration: 2,
  }
];
```

#### コード例

```JavaScript
  socket.emit(
    'connectController',
    { userId: visitorId, channelId: channelSlug },
    (err, value) => {
      if (err) {
        error(err);
        return;
      }
      pongs = value;
      done();
    },
  );
```

### 効果音送信

クライアント接続したソケットから効果音を送信する

#### イベント名

pongSwoosh

#### ペイロード

| 項目名 | 内容         |
|-------|-------------|
| id | 効果音ID。効果音セットで戻る id 値を指定する |

#### コールバック関数

なし

#### コード例

```JavaScript
  socket.emit('pongSwoosh', { id });
```

### 効果音受信

リスナーで再生する効果音を受信する

#### イベント名

pongSwoosh

#### ペイロード

| 項目名 | 内容         |
|-------|-------------|
| pongId | 効果音ID。効果音セットで戻る id 値 |
| volume | ボリューム |
| timestamp | タイムスタンプ |

volume は [WebAudio API の GainNode.gain](https://developer.mozilla.org/en-US/docs/Web/API/GainNode/gain) の value に指定できる値範囲となっている。

タイムスタンプは現在再生中のものと重複するものを除外する場合などに利用できる。

#### コールバック関数

なし

#### コード例

```JavaScript
    socket.on(
      'pongSwoosh',
      async (pongId: string, volume: number, timestamp: string) => {
        if (pongSounds[pongId] && pongSounds[pongId].timestamp === timestamp) {
          pongSounds[pongId].volume = volume;
          pongSounds[pongId].gainNode.gain.value = isMuted ? 0 : volume * sliderVolume;
        } else {
          window.AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContext();
          const audioBuffer = await ctx.decodeAudioData(pongActions.find((action) => action.id == pongId).buffer.slice(0));
          const src = ctx.createBufferSource();
          src.buffer = audioBuffer;
          pongSounds[pongId] = {
            gainNode: ctx.createGain(),
            timestamp,
          };
          src.connect(pongSounds[pongId].gainNode);
          pongSounds[pongId].gainNode.connect(ctx.destination);
          pongSounds[pongId].volume = volume;
          pongSounds[pongId].gainNode.gain.value = isMuted ? 0 : volume * sliderVolume;
          src.start();
        }
      },
    );
```

### 参加人数通知

リスナー接続したクライアントへ、参加人数が変更になるたび通知される

#### イベント名

latestParticipants

#### ペイロード

| 項目名 | 内容         |
|-------|-------------|
| listners | 参加人数 |

#### コールバック関数

なし

#### コード例

```JavaScript
    socket.on('latestParticipants', (listners:number) => {
      participants = listners
    })
```
