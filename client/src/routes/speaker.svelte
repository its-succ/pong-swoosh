<script lang="ts">
import { io } from "socket.io-client"
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Circle3 } from 'svelte-loading-spinners'

type Params = { channelSlug: string };
export let params: Params;

async function signIn() {
  let done;
  const ret = new Promise((resolve) => {
    done = resolve;
  });
  const socket = io('https://pong-swoosh-server.herokuapp.com');
  const channelSlug = params.channelSlug;
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const visitorId = result.visitorId;

  socket.on('connect', () => {
    console.log('connected', socket.id);
    socket.emit('connectListener', {userId: visitorId, channelId: channelSlug});
    done();
  });

  socket.on('disconnect', () => {
    console.log(socket.id); // undefined
  });

  socket.on('pongSwoosh', (pongId, url, volume, timestamp) => {
    // TODO: 効果音再生
  });

  return ret;
}

// For Circle3
let size = "60";
let unit = "px";

</script>

<style>
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>

<main>
{#await signIn()}
  <div class="loading">
    <Circle3
      {size}
      {unit}
      ballTopLeft="#FF3E00"
      ballTopRight="#F8B334"
      ballBottomLeft="#40B3FF"
      ballBottomRight="#676778" />
  </div>
{:then value}
  <h1>スピーカー画面</h1>
{:catch error}
  <h1>接続できませんでした</h1>
{/await}
</main>
