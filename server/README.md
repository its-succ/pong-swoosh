# サーバーアプリ

## ローカル実行

### Redis を起動

```
docker run --name redis -d -p 6379:6379 redis redis-server --appendonly yes
```

### Firesore Emulator を起動

デフォルトが 8080 ポートなので、問題あれば必要に応じて `--host-port` で変更します。

```
gcloud emulators firestore start --host-port=localhost:8999
```

Firestore Emulator の起動に JDK 11+ が必要になるので、OpenJDK とかインストールしておくこと

### ローカルサーバー起動

```
DEBUG=pong-swoosh REDIS_URL=6379 FIRESTORE_EMULATOR_HOST=localhost:8999 NODE_ENV=development npm start
```
