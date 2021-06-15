<style>
main {
  width: 100%;
  height: 100%;
}
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.volume {
  display: flex;
  justify-content: flex-start;
}
.play {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  flex-flow: column;
}
.play .icon {
  color: #FF9800;
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
  --mdc-theme-secondary: #FF9800;
  --mdc-theme-text-primary-on-dark: #white;
  width: 100%;
}
#volumeup {
  display: block;
  margin: auto 0;
}
</style>

<script lang="ts">
import { io } from 'socket.io-client';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Circle3 } from 'svelte-loading-spinners';
import { SERVER_URL } from '../pong-swoosh';
import '@material/mwc-slider';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faVolumeUp, faVolumeMute, faPlayCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from 'fontawesome-svelte';

library.add(faVolumeUp, faVolumeMute, faPlayCircle);

type Params = { channelSlug: string };
export let params: Params;

const pongs: any[] = [];

async function signIn() {
  let done;
  const ret = new Promise((resolve) => {
    done = resolve;
  });
  const socket = io(SERVER_URL);
  const channelSlug = params.channelSlug;
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const visitorId = result.visitorId;

  socket.on('connect', () => {
    console.log('connected', socket.id);
    socket.emit('connectListener', { userId: visitorId, channelId: channelSlug });
    done();
  });

  socket.on('disconnect', () => {
    console.log(socket.id); // undefined
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

const onClickMute = () => {
  isMuted = !isMuted;
  volumeIcon = !isMuted ? 'volume-up' : 'volume-mute';
  pongs.forEach(pong => {
    if (isMuted) {
      pong.gainNode.gain.value = 0
    } else {
      pong.gainNode.gain.value = pong.volume
    }
  })
}

const onChangeVolume = (event) => {
  sliderVolume = event.target.value / 100;
  pongs.forEach(pong => {
    if (!isMuted) {
      pong.gainNode.gain.value = pong.volume * sliderVolume;
    }
  })
}

const onClickCanPlay = () => {
  canPlay = !canPlay;
}

</script>

<main>
  {#if canPlay === false}
    <div class="play">
      <div class="icon" on:click={onClickCanPlay}>
        <FontAwesomeIcon icon="play-circle" size="10x"></FontAwesomeIcon>
      </div>
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
    {:then value}
      <h1>スピーカー画面</h1>
      <div class="volume">
        <div id="volumeup" on:click={onClickMute}>
          <FontAwesomeIcon icon="{volumeIcon}" size="lg"></FontAwesomeIcon>
        </div>
        <div class="slider">
          <mwc-slider pin step="1" value="50" min="0" max="100" on:change={onChangeVolume}></mwc-slider>
        </div>
      </div>
    {:catch error}
      <h1>接続できませんでした</h1>
    {/await}
  {/if}
</main>
