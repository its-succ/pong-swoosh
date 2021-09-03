<style>
:global(body) {
  margin: 0;
  padding: 0;
}

main {
  padding: 0;
  margin: 0 auto;
  height: 100%;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

audio {
  display: none;
}

mwc-top-app-bar {
  --mdc-theme-primary: #00bcd4;
  --mdc-theme-on-primary: white;
}

[slot='title'] {
  font-family: 'Roboto Mono', monospace;
  -webkit-font-smoothing: antialiased;
  font-size: 2rem;
  line-height: 2rem;
  letter-spacing: 0.4px;
  text-align: center;
}

h2 {
  margin-left: 40px;
}

h2 .text {
  display: inline-block;
  vertical-align: top;
  margin-top: 10px;
  padding-left: 2rem;
  font-size: 1.4rem;
  font-weight: normal;
}

ul, li {
  list-style: none;
}

li {
  padding: 10px 0;
  display: flex;
  align-items: center;
}

mwc-button {
  width: 12rem;
  --mdc-theme-primary: black;
  --mdc-theme-on-primary: white;
}

ul > li > a {
  margin-left: 20px;
  color: #00bcd4;
}
a > .text {
  margin-left: 10px;
}

</style>

<script lang="ts">
import '@material/mwc-top-app-bar';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import { io } from 'socket.io-client';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Circle3 } from 'svelte-loading-spinners';
import { SERVER_URL } from '../pong-swoosh';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGamepad, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from 'fontawesome-svelte';

library.add(faGamepad, faVolumeUp);

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
  socket = io(SERVER_URL, { forceNew: true });
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

  socket.on("connect_error", (error) => {
    console.error(error);
  });

  socket.on('disconnect', () => {
    console.log(socket.id); // undefined
  });
  return ret;
}

const pongSwoosh = (id) => {
  buttons[id].disabled = true;
  setTimeout(() => (buttons[id].disabled = false), pongs.find((p) => p.id === id).duration * 1000);
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
    <mwc-top-app-bar>
      <h1 slot="title">pong-swoosh</h1>
      <div>
        <h2>
          <FontAwesomeIcon icon="{faGamepad}" size="2x" /><span class="text">コントローラー</span>
        </h2>
        {#if pongs}
          <ul>
            {#each pongs as pong}
              <li>
                <mwc-button icon="send" label="{pong.title}" raised on:click="{() => pongSwoosh(pong.id)}" bind:this="{buttons[pong.id]}" outlined></mwc-button>
                <!-- svelte-ignore a11y-media-has-caption -->
                <audio src="{pong.url}" bind:this="{audios[pong.id]}"></audio>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a href="javascript:void(0)" on:click="{() => playAudio(pong.id)}"><FontAwesomeIcon icon="{faVolumeUp}"/><span class="text">試聴</span></a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </mwc-top-app-bar>
  {:catch error}
    <mwc-snackbar
      labelText="接続できませんでした"
      open
      timeoutMs="-1"></mwc-snackbar>
  {/await}
</main>
