# サーバーアプリ

## ローカル実行

### Redis を起動

```
docker run --name redis -d -p 6379:6379 redis redis-server --appendonly yes
```

### ローカルサーバー起動

```
DEBUG=pong-swoosh REDIS_URL=6379 NODE_ENV=development npm start
```
