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
DEBUG=pong-swoosh REDIS_URL=$REDISHOST FIRESTORE_EMULATOR_HOST=localhost:8999 NODE_ENV=development npm start
```

## デプロイ

### 事前準備

[ソースコードからのデプロイ](https://cloud.google.com/run/docs/deploying-source-code?hl=ja)

### コマンド

```
export REGION=asia-northeast1
export REDISHOST=redis://<username>:<password>@redis-13431.c1.asia-northeast1-1.gce.cloud.redislabs.com:13431

gcloud run deploy pong-swoosh --source . \
--project pong-swoosh \
--allow-unauthenticated \
--region $REGION \
--timeout 3600 \
--max-instances 5 \
--set-env-vars REDIS_URL=$REDISHOST
```
