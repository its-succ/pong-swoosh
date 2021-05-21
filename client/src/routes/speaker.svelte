<style>
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<script lang="ts">
import { io } from 'socket.io-client';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Circle3 } from 'svelte-loading-spinners';
import { SERVER_URL } from '../pong-swoosh';
import Slider from '@smui/slider';

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
        pongs[pongId].gainNode.gain.value = volume * sliderVolume;
      } else {
        window.AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        const audioBuffer = await ctx.decodeAudioData(buffer);
        const src = ctx.createBufferSource();
        src.buffer = audioBuffer;
        src.connect(ctx.destination);
        pongs[pongId] = {
          gainNode: ctx.createGain(),
          timestamp,
        };
        src.connect(pongs[pongId].gainNode);
        pongs[pongId].gainNode.connect(ctx.destination);
        pongs[pongId].gainNode.gain.value = volume * sliderVolume;
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
let sliderVolume = 1;
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
    <h1>スピーカー画面</h1>
    <Slider
      bind:value={sliderVolume}
      min={0.1}
      max={1}
      step={0.1}
    />
    
    <pre class="status">Volume: {sliderVolume*10} </pre>
  {:catch error}
    <h1>接続できませんでした</h1>
  {/await}
</main>
