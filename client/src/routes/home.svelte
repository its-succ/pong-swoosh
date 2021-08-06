<style>
:global(body) {
  margin: 0;
  padding: 0;
}

main {
  padding: 0;
  margin: 0 auto;
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

.entranceUrl {
  margin: 1rem;
  padding: 20px;
  box-shadow: 2px 2px 8px gray;
}

.entranceUrl > div {
  cursor: pointer;
}

.entranceUrl * {
  display: inline-block;
}

.warning {
  background-color: lightyellow;
  margin: 5rem 50px 0 50px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { SERVER_URL } from '../pong-swoosh';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faUsers, faVolumeUp, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from 'fontawesome-svelte';
import copy from 'copy-to-clipboard';

library.add(faUsers, faVolumeUp, faShareAlt, faCopy);

let channelName = '';
let entranceUrl: string | undefined;
let socket;

const createChannel = async () => {
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
    if (err) {
      const snackbar = document.querySelector('#createError') as any;
      snackbar.show();
      return;
    }
    const url = location.href;
    entranceUrl = `${url}#/entrance/${id}/${encodeURIComponent(channelName)}`;
  });
};

const beforeUnload = (event) => {
  if (entranceUrl) {
    event.preventDefault();
    event.returnValue = `このページを離れると ${channelName} が終了します。よろしいですか？`;
  }
  return event.returnValue;
};

const copyToClipbord = () => {
  copy(entranceUrl);
  const snackbar = document.querySelector('#copiedToClipbord') as any;
  snackbar.show();
};

const closeChannel = () => {
  socket.emit('deleteChannel');
  socket.close();
  entranceUrl = undefined;
};

const unload = () => {
  if (entranceUrl) {
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
      {#if entranceUrl}
        <div class="success">
          <strong
            >チャンネル「{channelName}」を作成しました。以下のURLを参加者に共有してください。</strong>
        </div>
        <div class="entranceUrl">
          <div on:click="{copyToClipbord}"><FontAwesomeIcon icon="{faCopy}" size="2x" />&nbsp;</div>
          <!-- svelte-ignore a11y-missing-content -->
          <a href="{entranceUrl}">{entranceUrl}</a>
        </div>
        <div class="warning">
          <strong>このページを離れると {channelName} が終了します。ご注意ください。</strong>
          <mwc-button label="チャンネル終了" raised on:click="{closeChannel}"></mwc-button>
        </div>
        <mwc-snackbar
          id="copiedToClipbord"
          labelText="クリップボードにURLをコピーしました"
          timeoutMs="4000"></mwc-snackbar>
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
