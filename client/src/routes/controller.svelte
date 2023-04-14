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

ul {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin: 0;
  padding: 0;
}
li {
  padding: 10px 0;
  align-items: center;
}
button {
  height: 5rem;
  width: 10rem;
  position: relative;
  cursor: pointer;
  margin: 1rem;
}
button img {
  padding-left: 6px;
  width: 2rem;
  float: left;
}
button label {
  font-weight: bold;
  font-size: 0.8rem;
  line-height: 2rem;
}

@media screen and (max-width: 380px) {
  button {
    height: 4rem;
    width: 10rem;
    position: relative;
    cursor: pointer;
    margin: 0.25rem;
  }
}

</style>

<script lang="ts">
import '@material/mwc-top-app-bar';
import '@material/mwc-snackbar';
import { io } from 'socket.io-client';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Circle3 } from 'svelte-loading-spinners';
import { SERVER_URL } from '../pong-swoosh';
import { library } from '@fortawesome/fontawesome-svg-core';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faGamepad, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import Fa from 'svelte-fa'

library.add(...[faGamepad, faVolumeUp].map((fa) => <IconDefinition>fa));

type Params = { channelSlug: string };
export let params: Params;

let socket: ReturnType<typeof io>;
let pongs: any[];
let buttons = {};

async function signIn() {
  let done;
  let error;
  let disconnected = false;
  const ret = new Promise((resolve, reject) => {
    done = resolve;
    error = reject;
  });
  socket = io(SERVER_URL, { forceNew: true });
  const channelSlug = params.channelSlug;
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const visitorId = result.visitorId;

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

  const reconnect = () => {
    if (disconnected) {
      socket.emit('connectController', { userId: visitorId, channelId: channelSlug }, (err) => {
        if (err) {
          setTimeout(reconnect, 3000);
          return;
        }
        disconnected = false;
        (document.querySelector('#disconnectFromServer') as any).close('サーバーとの接続が復帰しました');
      });
    }
  };
  socket.on('connect', () => {
    console.log('connected', socket.id);
    reconnect();
  });

  socket.on("connect_error", (err) => {
    console.error(err);
    error(err);
  });

  socket.on('disconnect', () => {
    console.log(socket.id); // undefined
    (document.querySelector('#disconnectFromServer') as any).show();
    disconnected = true;
  });
  return ret;
}

const pongSwoosh = (id) => {
  buttons[id].disabled = true;
  setTimeout(() => (buttons[id].disabled = false), pongs.find((p) => p.id === id).duration * 1000);
  socket.emit('pongSwoosh', { id });
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
          <Fa icon="{faGamepad}" size="2x" /><span class="text">コントローラー</span>
        </h2>
        {#if pongs}
          <ul>
            {#each pongs as pong}
              <li>
                <button on:click="{() => pongSwoosh(pong.id)}" bind:this="{buttons[pong.id]}">
                  <img src="{pong.icon}" alt="icon">
                  <!-- svelte-ignore a11y-label-has-associated-control -->
                  <label>{pong.title}</label>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
        <mwc-snackbar
          id="disconnectFromServer"
          labelText="サーバーから切断されました"
          timeoutMs="-1"></mwc-snackbar>
      </div>
    </mwc-top-app-bar>
  {:catch error}
    <mwc-top-app-bar>
      <h1 slot="title">pong-swoosh</h1>
      <div>
        <mwc-snackbar
          labelText="接続できませんでした"
          open
          timeoutMs="-1"></mwc-snackbar>
      </div>
    </mwc-top-app-bar>
  {/await}
</main>
