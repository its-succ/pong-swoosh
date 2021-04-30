<script lang="ts">
  import { io } from "socket.io-client";
  import FingerprintJS from '@fingerprintjs/fingerprintjs';
  import { Circle3 } from 'svelte-loading-spinners';
  import { SERVER_URL } from '../pong-swoosh';

  type Params = { channelSlug: string };
  export let params: Params;

  let socket;
  let pongs: any[];

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
      socket.emit('connectController', {userId: visitorId, channelId: channelSlug},
        (err, value) => {
          if (err) {
            console.error(err);
            return;
          }
          pongs = value;
        }
      );
      done();
    });

    socket.on('disconnect', () => {
      console.log(socket.id); // undefined
    });
    return ret;
  }

  const pongSwoosh = (id) => {
    socket.emit('pongSwoosh', { id });
  };

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
    <h1>コントローラ画面</h1>
    {#if pongs}
    <ul>
      {#each pongs as pong}
		    <li><button on:click={() => pongSwoosh(pong.id)}>{pong.title}</button></li>
	    {/each}
    </ul>
    {/if}
  {:catch error}
    <h1>接続できませんでした</h1>
  {/await}
  </main>
