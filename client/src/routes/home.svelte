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

form {
  margin: 0;
  padding: 4rem 20% 2rem 20%;
  text-align: center;
}

mwc-textfield {
  width: 100%;
}

mwc-button {
  --mdc-theme-primary: #ff6600;
  --mdc-theme-on-primary: white;
  --mdc-button-disabled-fill-color: #ff6600;
  --mdc-button-disabled-ink-color: white;
}

form > mwc-button {
  width: 30%;
  margin-top: 2rem;
}

#intro {
  margin-top: 2rem;
  display: flex;
  justify-content: space-around;
  padding: 0 40px;
}

#intro > div {
  padding: 30px;
}

.icon {
  color: #00bcd4;
  display: block;
  text-align: center;
}

#intro p {
  font-size: small;
  padding: 1rem;
}

.success {
  margin: 10px 0;
  padding: 1rem;
  background-color: #009900;
  color: white;
}

.pongSwooshUrl {
  margin: 1rem;
  padding: 20px;
  box-shadow: 2px 2px 8px gray;
}

.pongSwooshUrl > div {
  cursor: pointer;
}

.pongSwooshUrl * {
  display: inline-block;
}

/* TODO: ボタン表示のスタイルを修正する。
   それかコンポーネント化して利用する。(pong-swoosh.svelteでも利用する
 */
.default-buttons {
  padding: 2rem;
}

ul, li {
  list-style: none;
}
ul {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
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

.warning {
  background-color: lightyellow;
  margin: 5rem 50px 0 50px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  flex-flow: column;
}

@media (min-width: 640px) {
  main {
    max-width: none;
  }
}
</style>

<script lang="ts">
import '@material/mwc-top-app-bar';
import '@material/mwc-textfield';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import { io } from 'socket.io-client';
import { Circle3 } from 'svelte-loading-spinners';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { SERVER_URL } from '../pong-swoosh';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faUsers, faVolumeUp, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from 'fontawesome-svelte';
import copy from 'copy-to-clipboard';

library.add(faUsers, faVolumeUp, faShareAlt, faCopy);

let channelName = '';
let pongSwooshUrl: string | undefined;
let socket;
let channelId: string;
// For Circle3
let loading = false;
let size = '60';
let unit = 'px';
let allButtons: any[];
let defaultButtons: any[]

const createChannel = async () => {
  loading = true;
  const input = document.querySelector('#channelName') as any;
  channelName = input.value;
  if (channelName.trim().length === 0) {
    return;
  }

  socket = io(SERVER_URL, { forceNew: true });
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const userId = result.visitorId;

  socket.emit('createChannel', { userId, channelName }, (err, id) => {
    loading = false;
    if (err) {
      const snackbar = document.querySelector('#createError') as any;
      snackbar.show();
      return;
    }
    const url = location.href;
    pongSwooshUrl = `${url}#/pong-swoosh/${id}/${encodeURIComponent(channelName)}`;
    channelId = id;
    socket.emit('allButtons', (allPongs) => {
      allButtons = allPongs;
      defaultButtons = allButtons.filter(button => button.default)
    })
  });

  socket.on('connect', () => {
    console.log('connected', socket.id);
    if (pongSwooshUrl) {
      socket.emit('createChannel', { userId, channelName, channelId }, (err) => {
        if (err) {
          console.error('Error reConnect channel', err);
        }
        console.log('re connected to channel', channelName);
      });
    }
  });

  socket.on("connect_error", (err) => {
    console.error(err);
  });

  socket.on('disconnect', () => {
    console.log('disconnect');
  });
};

const beforeUnload = (event) => {
  if (pongSwooshUrl) {
    event.preventDefault();
    event.returnValue = `このページを離れると ${channelName} が終了します。よろしいですか？`;
  }
  return event.returnValue;
};

const copyToClipbord = () => {
  copy(pongSwooshUrl);
  const snackbar = document.querySelector('#copiedToClipbord') as any;
  snackbar.show();
};

const closeChannel = () => {
  socket.emit('deleteChannel');
  socket.close();
  pongSwooshUrl = undefined;
};

const unload = () => {
  if (pongSwooshUrl) {
    closeChannel();
  }
};

</script>

<main>
  <mwc-top-app-bar prominent centerTitle>
    <div slot="title">
      pong-swoosh
      <div class="subtitle">リモートポン出しWebシステム - Pong (っ’-‘)╮ =͟͟͞͞ 🎉</div>
    </div>
    <div>
      {#if pongSwooshUrl}
        <div class="success">
          <strong
            >チャンネル「{channelName}」を作成しました。以下のURLを参加者に共有してください。</strong>
        </div>
        <div class="pongSwooshUrl">
          <div on:click="{copyToClipbord}"><FontAwesomeIcon icon="{faCopy}" size="2x" />&nbsp;</div>
          <!-- svelte-ignore a11y-missing-content -->
          <a href="{pongSwooshUrl}">{pongSwooshUrl}</a>
        </div>
        {#if defaultButtons}
        <div class="default-buttons">
          <ul>
            {#each defaultButtons as button}
              <li>
                <button>
                  <img src="{button.icon}" alt="icon">
                  <!-- svelte-ignore a11y-label-has-associated-control -->
                  <label>{button.title}</label>
                </button>
              </li>
            {/each}
          </ul>
        </div>
        {/if}
        <div class="warning">
          <strong>このページを離れると {channelName} が終了します。ご注意ください。</strong>
          <mwc-button label="チャンネル終了" raised on:click="{closeChannel}"></mwc-button>
        </div>
        <mwc-snackbar
          id="copiedToClipbord"
          labelText="クリップボードにURLをコピーしました"
          timeoutMs="4000"></mwc-snackbar>
      {:else if loading}
        <div class="loading">
          <Circle3
            size="{size}"
            unit="{unit}"
            ballTopLeft="#FF3E00"
            ballTopRight="#F8B334"
            ballBottomLeft="#40B3FF"
            ballBottomRight="#676778" />
        </div>
      {:else}
        <form>
          <mwc-textfield
            id="channelName"
            placeholder="新しい共有チャンネルの名前を入力してください"
            helper="チャンネル名は効果音を共有する単位です"
            helperPersistent
            required></mwc-textfield>
          <mwc-button label="作成" raised on:click="{createChannel}"></mwc-button>
        </form>
        <div id="intro">
          <div>
            <div class="icon"><FontAwesomeIcon icon="users" size="3x" /></div>
            <p>ZoomやMeetなどのWeb会議システムを利用しながら、複数の人で効果音を共有できます</p>
          </div>
          <div>
            <div class="icon"><FontAwesomeIcon icon="volume-up" size="3x" /></div>
            <p>
              参加人数、リアクションした人の人数に応じてダイナミックに音量が変化するので、臨場感溢れる体験が得られます
            </p>
          </div>
          <div>
            <div class="icon"><FontAwesomeIcon icon="share-alt" size="3x" /></div>
            <p>利用は簡単、共有チャンネル名を入れて作成して表示されるURLを共有するだけです</p>
          </div>
        </div>
        <mwc-snackbar
          id="createError"
          labelText="そのチャンネル名は既に利用されています"
          timeoutMs="4000"></mwc-snackbar>
      {/if}
    </div>
  </mwc-top-app-bar>
</main>
<svelte:window on:beforeunload="{beforeUnload}" on:unload="{unload}" />
