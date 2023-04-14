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

  .subtitle {
    font-size: 0.8rem;
    padding: 1em 0;
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
    height: calc(100vh - 10rem);
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
    justify-content: flex-end;
    padding: 0px 40px;
  }
  .participants .icon {
    display: block;
    margin: auto 0;
  }
  .participants p {
    margin: 0 10px;
  }
  .pong-actions {
    padding: 2rem;
  }
  .control {
    display:flex;
  }
  .remote-help {
    margin: 1rem 2rem 0 auto;
    padding: 5px 10px;
    box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
    width: 20%;
    min-width: 15rem;
    font-size: 0.8rem;
  }
  .remote-help .header {
    text-align: right;
  }
  .remote-help .header .icon {
    color: white;
    background-color: #00bcd4;
    border-radius: 50%;
    width: 2rem;
    line-height: 2rem;
    display: inline-block;
    text-align: center;
    font-size: 1rem;
  }
  .qr {
    display: block;
    text-align: center;
    padding: 1rem;
  }
  .pong-actions .try {
    padding: 0.4em;
  }
  mwc-dialog {
    --mdc-dialog-max-width: 80%;
  }
  mwc-dialog p {
    padding: 1rem;
    text-align: center;
  }
</style>

<script lang="ts">
  import '@material/mwc-top-app-bar';
  import '@material/mwc-snackbar';
  import '@material/mwc-dialog';
  import { io } from 'socket.io-client';
  import type { Dialog } from '@material/mwc-dialog';
  import type { Socket } from 'socket.io-client';
  import type { Snackbar } from '@material/mwc-snackbar';
  import FingerprintJS from '@fingerprintjs/fingerprintjs';
  import { Circle3 } from 'svelte-loading-spinners';
  import { SERVER_URL } from '../pong-swoosh';
  import '@material/mwc-slider';
  import QrCode from 'svelte-qrcode';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
  import {
    faVolumeUp,
    faVolumeMute,
    faPlayCircle,
    faHeadphones,
    faUsers,
    faExternalLinkAlt,
  } from '@fortawesome/free-solid-svg-icons';
  import Fa from 'svelte-fa'
  import PongButtons from './../components/pong-buttons.svelte';

  library.add(...[faVolumeUp, faVolumeMute, faPlayCircle, faHeadphones, faUsers, faExternalLinkAlt].map((fa) => <IconDefinition>fa));

  type Params = { channelSlug: string; channelName: string };
  export let params: Params;

  let socket: Socket;
  const pongSounds: any[] = [];
  let pongActions: any[];
  let controllerUrl: string | undefined;

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
    const setupPongActions = async (value: any[]) => {
      const pongLoading = [];
      value.forEach((pong) => {
        pongLoading.push(fetch(pong.url));
      });
      const responses = await Promise.all(pongLoading);
      const pongBuffers = [];
      responses.forEach((response) => {
        pongBuffers.push(response.arrayBuffer());
      });
      const buffers = await Promise.all(pongBuffers);
      buffers.forEach((buffer, index) => {
        value[index].buffer = buffer;
      });
      return value;
    };

    socket.emit('connectListener', { userId: visitorId, channelId: channelSlug },
      (err, value) => {
        if (err) {
          error(err);
          return;
        }
        setupPongActions(value).then((results) => {
          pongActions = results;
          done();
        }).catch((e) => {
          error(e);
        });
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
          document.querySelector<Snackbar>('#disconnectFromServer').close('サーバーとの接続が復帰しました');
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
      document.querySelector<Snackbar>('#disconnectFromServer').show();
      disconnected = true;
    });

    socket.on(
      'pongSwoosh',
      async (pongId: string, volume: number, timestamp: string) => {
        console.log(JSON.stringify({ pongId, volume, timestamp }));
        if (pongSounds[pongId] && pongSounds[pongId].timestamp === timestamp) {
          pongSounds[pongId].volume = volume;
          pongSounds[pongId].gainNode.gain.value = isMuted ? 0 : volume * sliderVolume;
        } else {
          window.AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContext();
          const audioBuffer = await ctx.decodeAudioData(pongActions.find((action) => action.id == pongId).buffer.slice(0));
          const src = ctx.createBufferSource();
          src.buffer = audioBuffer;
          pongSounds[pongId] = {
            gainNode: ctx.createGain(),
            timestamp,
          };
          src.connect(pongSounds[pongId].gainNode);
          pongSounds[pongId].gainNode.connect(ctx.destination);
          pongSounds[pongId].volume = volume;
          pongSounds[pongId].gainNode.gain.value = isMuted ? 0 : volume * sliderVolume;
          src.start();
        }
      },
    );

    socket.on('updatePongs', async (value: any[]) => {
      pongActions = await setupPongActions(value);
      document.querySelector<Snackbar>('#notifyUpdatePong').show();
    });

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
    pongSounds.forEach((pong) => {
      if (isMuted) {
        pong.gainNode.gain.value = 0;
      } else {
        pong.gainNode.gain.value = pong.volume;
      }
    });
  };

  const onChangeVolume = (event) => {
    sliderVolume = event.target.value / 100;
    pongSounds.forEach((pong) => {
      if (!isMuted) {
        pong.gainNode.gain.value = pong.volume * sliderVolume;
      }
    });
  };

  const onClickCanPlay = () => {
    canPlay = !canPlay;
  };

  const showPage = () => {
    const channelSlug = params.channelSlug;
    const url = location.origin + location.pathname;
    controllerUrl = `${url}/#/contoller/${channelSlug}`;
  };

  const pongTry = () => {
    document.querySelector<Dialog>('#pong-try').show();
  }
</script>

<main>
  <mwc-top-app-bar prominent centerTitle>
    <div slot="title">
      pong-swoosh
      <div class="subtitle">リモートポン出しWebシステム - Pong (っ’-‘)╮ =͟͟͞͞ 🎉</div>
    </div>
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
      {:then value}
        <div>
          <div class="control">
            {#if pongActions}
              <div class="pong-actions">
                {#if pongActions}
                  <PongButtons pongButtons={pongActions} socket={socket}></PongButtons>
                {/if}
                <!-- svelte-ignore a11y-invalid-attribute -->
                <p class="try"><a href="javascript:void(0)" on:click="{pongTry}">効果音を試聴する&nbsp;<Fa icon={faExternalLinkAlt} /></a></p>
              </div>
            {/if}
            <div class="remote-help">
              <p class="header">
                <span class="icon">？</span>
              </p>
              <p>
                この画面がバックグラウンドになってしまい、効果音ボタンが押せない時は、スマートフォンを効果音を送るリモコンにできます。<br>
                以下のQRコードより効果音送信画面にアクセスしてください。<br><br>
                ※音声はこの画面から出ます
              </p>
              <p class="qr"><QrCode value="{controllerUrl}" size="100"/></p>
            </div>
          </div>
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
            <div class="icon"><Fa icon={faUsers} size="lg" /></div>
            <p>現在の参加者数は {participants}人です。</p>
          </div>
          <mwc-snackbar
            id="disconnectFromServer"
            labelText="サーバーから切断されました"
            timeoutMs="-1"></mwc-snackbar>
        </div>
        <mwc-dialog id="pong-try">
          {#if pongActions}
            <PongButtons pongButtons={pongActions}></PongButtons>
          {/if}
          <p>試聴では効果音は送信されず、この画面でのみ再生されます</p>
          <mwc-button
              slot="primaryAction"
              dialogAction="discard">
            閉じる
          </mwc-button>
        </mwc-dialog>
      {:catch error}
        <div>
          <mwc-snackbar labelText="接続できませんでした" open timeoutMs="-1"></mwc-snackbar>
        </div>
      {/await}
      <div>
        <mwc-snackbar id="notifyUpdatePong" labelText="チャンネルオーナーが利用できる効果音を変更しました" timeoutMs="3000"></mwc-snackbar>
      </div>
  {/if}
  </mwc-top-app-bar>
</main>
<svelte:window on:load="{showPage}" />
