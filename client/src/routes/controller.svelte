<style>
main {
  height: 100%;
}
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
audio {
  width: 150px;
  height: 40px;
}
</style>

<script lang="ts">
import { io } from 'socket.io-client';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Circle3 } from 'svelte-loading-spinners';
import { SERVER_URL } from '../pong-swoosh';

type Params = { channelSlug: string };
export let params: Params;

let socket;
let pongs: any[];
let buttons = {};
let audios = {};

async function signIn() {
  let done;
  const ret = new Promise((resolve) => {
    done = resolve;
  });
  socket = io(SERVER_URL);
  const channelSlug = params.channelSlug;
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const visitorId = result.visitorId;

  socket.on('connect', () => {
    console.log('connected', socket.id);
    socket.emit(
      'connectController',
      { userId: visitorId, channelId: channelSlug },
      (err, value) => {
        if (err) {
          console.error(err);
          return;
        }
        pongs = value;
      },
    );
    done();
  });

  socket.on('disconnect', () => {
    console.log(socket.id); // undefined
  });
  return ret;
}

const pongSwoosh = (id) => {
  buttons[id].disabled = true;
  setTimeout(() => buttons[id].disabled = false, pongs.find(p => p.id === id).duration * 1000);
  socket.emit('pongSwoosh', { id });
};

const playAudio = (id) => {
  audios[id].play();
};

// For Circle3
let size = '60';
let unit = 'px';
</script>

<main>
  {#await signIn()}
    <div class="loading">
      <Circle3
        size="{size}"
        unit="{unit}"
        ballTopLeft="#FF3E00"
        ballTopRight="#F8B334"
        ballBottomLeft="#40B3FF"
        ballBottomRight="#676778" />
    </div>
  {:then value}
    <h1>コントローラ画面</h1>
    {#if pongs}
      <ul>
        {#each pongs as pong}
          <li>
            <button on:click="{() => pongSwoosh(pong.id)}" bind:this="{buttons[pong.id]}">{pong.title}</button>
            <!-- svelte-ignore a11y-media-has-caption -->
            <audio src={pong.url} bind:this="{audios[pong.id]}"></audio>
            <button on:click="{() => playAudio(pong.id)}">視聴 ▶︎</button>
          </li>
        {/each}
      </ul>
    {/if}
  {:catch error}
    <h1>接続できませんでした</h1>
  {/await}
</main>