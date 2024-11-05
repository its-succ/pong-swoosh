<style>
:global(body) {
  margin: 0;
  padding: 0;
}

main {
  padding: 0;
  margin: 0 auto;
  width: 100%;
  height: 100%;
}

mwc-top-app-bar {
  --mdc-theme-primary: #00bcd4;
  --mdc-theme-on-primary: white;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  flex-flow: column;
}
.volume {
  display: flex;
  justify-content: flex-start;
  padding: 40px;
}
.play {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  flex-flow: column;
}
.play .icon {
  color: #ff9800;
  cursor: pointer;
  display: block;
}
.play label {
  display: block;
  margin: 5px;
}
.slider {
  margin: 0 10px;
  flex-grow: 1;
}
mwc-slider {
  --mdc-theme-secondary: #ff9800;
  --mdc-theme-text-primary-on-dark: #white;
  width: 100%;
}
#volumeup {
  display: block;
  margin: auto 0;
}
.participants {
  display: flex;
  justify-content: flex-start;
  padding: 0px 40px;
}
.participants .icon {
  display: block;
  margin: auto 0;
}
.participants p {
  margin: 0 10px;
}
</style>

<script lang="ts">
import '@material/mwc-top-app-bar';
import '@material/mwc-snackbar';
import { io } from 'socket.io-client';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Circle3 } from 'svelte-loading-spinners';
import { SERVER_URL } from '../pong-swoosh';
import '@material/mwc-slider';
import { library } from '@fortawesome/fontawesome-svg-core';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faVolumeUp,
  faVolumeMute,
  faPlayCircle,
  faHeadphones,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import Fa from 'svelte-fa'

library.add(...[faVolumeUp, faVolumeMute, faPlayCircle, faHeadphones, faUsers].map((fa) => <IconDefinition>fa));

type Params = { channelSlug: string };
export let params: Params;

const pongs: any[] = [];

async function signIn() {
  let done;
  let error;
  let disconnected = false;
  const ret = new Promise((resolve, reject) => {
    done = resolve;
    error = reject;
  });
  const socket = io(SERVER_URL, { forceNew: true });
  const channelSlug = params.channelSlug;
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const visitorId = result.visitorId;

  socket.emit('connectListener', { userId: visitorId, channelId: channelSlug },
    (err) => {
      if (err) {
        error(err);
        return;
      }
      done();
    }
  );

  const reconnect = () => {
    if (disconnected) {
      socket.emit('connectListener', { userId: visitorId, channelId: channelSlug }, (err) => {
        if (err) {
          setTimeout(reconnect, 3000);
          return;
        }
        disconnected = false;
        (document.querySelector('#disconnectFromServer') as any).close('サーバーとの接続が復帰しました');
      });
    }
  }
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

  socket.on(
    'pongSwoosh',
    async (pongId: string, buffer: ArrayBuffer, volume: number, timestamp: string) => {
      console.log(JSON.stringify({ pongId, volume, timestamp }));
      if (pongs[pongId] && pongs[pongId].timestamp === timestamp) {
        pongs[pongId].volume = volume;
        pongs[pongId].gainNode.gain.value = isMuted ? 0 : volume * sliderVolume;
      } else {
        window.AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        const audioBuffer = await ctx.decodeAudioData(buffer);
        const src = ctx.createBufferSource();
        src.buffer = audioBuffer;
        pongs[pongId] = {
          gainNode: ctx.createGain(),
          timestamp,
        };
        src.connect(pongs[pongId].gainNode);
        pongs[pongId].gainNode.connect(ctx.destination);
        pongs[pongId].volume = volume;
        pongs[pongId].gainNode.gain.value = isMuted ? 0 : volume * sliderVolume;
        src.start();
      }
    },
  );


  socket.on('latestParticipants', (listners:number) => {
    console.log(listners)
    participants = listners
  })

  return ret;
}

// For Circle3
let size = '60';
let unit = 'px';
// For Slider
let sliderVolume = 0.5;
// For Volume
let isMuted = false;
let volumeIcon = 'volume-up';
let canPlay = false;
// For participants
let participants = 0;

const onClickMute = () => {
  isMuted = !isMuted;
  volumeIcon = !isMuted ? 'volume-up' : 'volume-mute';
  pongs.forEach((pong) => {
    if (isMuted) {
      pong.gainNode.gain.value = 0;
    } else {
      pong.gainNode.gain.value = pong.volume;
    }
  });
};

const onChangeVolume = (event) => {
  sliderVolume = event.target.value / 100;
  pongs.forEach((pong) => {
    if (!isMuted) {
      pong.gainNode.gain.value = pong.volume * sliderVolume;
    }
  });
};

const onClickCanPlay = () => {
  canPlay = !canPlay;
};
</script>

<main>
  <mwc-top-app-bar>
    <h1 slot="title">pong-swoosh</h1>
    {#if canPlay === false}
      <div class="play">
        <div class="icon" on:click="{onClickCanPlay}">
          <Fa icon={faPlayCircle} size="10x" />
        </div>
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label>再生して開始</label>
      </div>
    {:else}
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
      {:then}
        <div>
          <h2>
            <Fa icon="{faHeadphones}" size="2x" /><span class="text">スピーカー</span>
          </h2>
          <div class="volume">
            <div id="volumeup" on:click="{onClickMute}">
              <Fa icon="{volumeIcon}" size="lg" />
            </div>
            <div class="slider">
              <mwc-slider pin step="1" value="50" min="0" max="100" on:change="{onChangeVolume}"
              ></mwc-slider>
            </div>
          </div>
          <div class="participants">
            <div class="icon"><Fa icon="users" size="lg" /></div>
            <p>現在の参加者数は {participants}人です。</p>
          </div>
          <mwc-snackbar
            id="disconnectFromServer"
            labelText="サーバーから切断されました"
            timeoutMs="-1"></mwc-snackbar>
        </div>
      {:catch}
        <div>
          <mwc-snackbar labelText="接続できませんでした" open timeoutMs="-1"></mwc-snackbar>
        </div>
      {/await}
    {/if}
  </mwc-top-app-bar>
</main>
