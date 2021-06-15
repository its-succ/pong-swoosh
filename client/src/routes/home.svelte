<style>
main {
  text-align: center;
  padding: 1em;
  max-width: 240px;
  margin: 0 auto;
}

h1 {
  color: #ff3e00;
  text-transform: uppercase;
  font-size: 4em;
  font-weight: 100;
}

@media (min-width: 640px) {
  main {
    max-width: none;
  }
}
</style>

<script lang="ts">
import { io } from 'socket.io-client';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { SERVER_URL } from '../pong-swoosh';

let channelName = '';
let entranceUrl: string | undefined;

const createChannel = async () => {
  const socket = io(SERVER_URL);
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const userId = result.visitorId;

  socket.emit('createChannel', { userId, channelName }, (err, id) => {
    if (err) {
      console.error(err);
      return;
    }
    const url = location.href;
    entranceUrl = `${url}#/entrance/${id}?name=${channelName}`;
  });
};

</script>

<main>
  <h1>pong-swoosh</h1>

  <h2>チャンネル作成</h2>
  <label
    >チャンネル名<input type="text" placeholder="チャンネル名" bind:value="{channelName}" /></label>
  <button on:click="{createChannel}">作成</button>
  {#if entranceUrl}
    <div>
      <ul>
        <li>エントランスURL:{entranceUrl}</li>
      </ul>
    </div>
  {/if}
</main>
