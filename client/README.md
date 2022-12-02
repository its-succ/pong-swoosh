# サーバーアプリ

## ローカル実行

`pong-swoosh.ts` でサーバーの向き先を変更する。
クライアントとサーバーを両方ともローカル環境で動かす場合は、 `http://localhost:3000` を有効にする。

```bash
npm run dev
```

## テキストから音声の作成

Text To Speech のページのお試し機能を使って、JSON ファイルを作成する。

https://cloud.google.com/text-to-speech/

voice の下に JSON ファイルを入れる。
このとき `audioEncoding` を `MP3` に変更する。

`voice-text-2-mp3.js` に追加した JSON ファイルのパスを追加する。

### API を有効にしたプロジェクトを作成する

https://blog.apar.jp/web/9893/

を参考に個人の Google アカウントで Text-to-Speech API を有効にして、 gcloud コマンドで認証しておきます。

認証できていたら、以下のコマンドを実行します。

```bash
npm run voice2mp3
```
