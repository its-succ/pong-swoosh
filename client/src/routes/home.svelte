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

[slot="actionItems"] .icon {
  color: black;
  margin: 0 0.5rem;
}

.release {
  text-align: center;
  font-weight: bolder;
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

mwc-dialog {
  --mdc-dialog-max-width: 80%;
}

.custom {
  margin: -2em 0 0 0;
  padding: 0;
  text-align: center;
}

</style>

<script lang="ts">
import '@material/mwc-top-app-bar';
import '@material/mwc-textfield';
import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-snackbar';
import { io } from 'socket.io-client';
import { Circle3 } from 'svelte-loading-spinners';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { SERVER_URL } from '../pong-swoosh';
import { library } from '@fortawesome/fontawesome-svg-core';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faUsers, faVolumeUp, faShareAlt, faCog, faRocket, faBug, faUser } from '@fortawesome/free-solid-svg-icons';
import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub';
import Fa from 'svelte-fa'
import copy from 'copy-to-clipboard';
import PongButtons from './../components/pong-buttons.svelte';
import type { Dialog } from '@material/mwc-dialog';

library.add(...[faUsers, faVolumeUp, faShareAlt, faCopy, faCog, faGithub, faRocket, faBug].map((fa) => <IconDefinition>fa));

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
let isOverSelected = false;
let selectedButtonIds;
let selectedButtons = [];

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
      socket.emit('createChannel', { userId, channelName, channelId, selectedButtons }, (err) => {
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

const pongCustom = () => {
  document.querySelector<Dialog>('#pong-custom').show();
  document.querySelector<Dialog>('#pong-custom').addEventListener('closed', (e) => {
    if ((<CustomEvent>e).detail.action === 'ok') {
      selectedButtons = selectedButtonIds();
      socket.emit('saveCustomButtons', { buttonIds: selectedButtons }, (err) => {
        if (err) {
          console.error('Error saveCustomButtons', err);
        }
      });
      defaultButtons = allButtons.filter(button => selectedButtons.includes(button.id))
    }
  });
}
</script>

<main>
  <mwc-top-app-bar prominent centerTitle>
    <div slot="title">
      pong-swoosh
      <div class="subtitle">リモートポン出しWebシステム - Pong (っ’-‘)╮ =͟͟͞͞ 🎉</div>
    </div>
    <a href="https://github.com/its-succ/pong-swoosh" target="_blank" rel="noreferrer" slot="actionItems" title="GitHubリポジトリ"><div class="icon"><Fa icon={faGithub} /></div></a>
    <a href="https://github.com/its-succ/pong-swoosh/releases" target="_blank" rel="noreferrer" slot="actionItems" title="リリース一覧"><div class="icon"><Fa icon={faRocket} /></div></a>
    <a href="https://github.com/its-succ/pong-swoosh/issues" target="_blank" rel="noreferrer" slot="actionItems" title="不具合/改善要望"><div class="icon"><Fa icon={faBug} /></div></a>
    <div>
      {#if pongSwooshUrl}
        <div class="success">
          <strong
            >チャンネル「{channelName}」を作成しました。以下のURLを参加者に共有してください。</strong>
        </div>
        <div class="pongSwooshUrl">
          <div on:click="{copyToClipbord}"><Fa icon={faCopy} size="2x" />&nbsp;</div>
          <!-- svelte-ignore a11y-missing-content -->
          <a href="{pongSwooshUrl}">{pongSwooshUrl}</a>
        </div>
        {#if defaultButtons}
          <PongButtons pongButtons={defaultButtons}></PongButtons>
          <p class="custom"><a href="javascript:void(0)" on:click="{pongCustom}">効果音を変更する&nbsp;<Fa icon={faCog} /></a></p>
        {/if}
        <div class="warning">
          <strong>このページを離れると {channelName} が終了します。ご注意ください。</strong>
          <mwc-button label="チャンネル終了" raised on:click="{closeChannel}"></mwc-button>
        </div>
        <mwc-snackbar
          id="copiedToClipbord"
          labelText="クリップボードにURLをコピーしました"
          timeoutMs="4000"></mwc-snackbar>
        <mwc-dialog id="pong-custom">
          {#if allButtons}
            <PongButtons pongButtons={allButtons} selectable bind:isOverSelected={isOverSelected} bind:selectedButtonIds={selectedButtonIds}></PongButtons>
          {/if}
          <mwc-button
              slot="primaryAction"
              dialogAction="ok"
              disabled="{isOverSelected}">
            保存
          </mwc-button>
          <mwc-button
              slot="secondaryAction"
              dialogAction="cancel">
            キャンセル
          </mwc-button>
          <mwc-snackbar
            id="overSelectedError"
            labelText="選択できる効果音の数は8つまでです"
            timeoutMs="4000"
            open="{isOverSelected}"
            ></mwc-snackbar>
        </mwc-dialog>
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
        <p class="release"><Fa icon={faRocket} />&nbsp;2023年4月14日 新しいバージョンをリリースしました。詳しくは<a href="https://github.com/its-succ/pong-swoosh/releases/tag/v1.1.0" target="_blank" rel="noreferrer">リリースノート</a>をご覧ください。</p>
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
            <div class="icon"><Fa icon={faUsers} size="3x" /></div>
            <p>ZoomやMeetなどのWeb会議システムを利用しながら、複数の人で効果音を共有できます</p>
          </div>
          <div>
            <div class="icon"><Fa icon={faVolumeUp} size="3x" /></div>
            <p>
              参加人数、リアクションした人の人数に応じてダイナミックに音量が変化するので、臨場感溢れる体験が得られます
            </p>
          </div>
          <div>
            <div class="icon"><Fa icon={faShareAlt} size="3x" /></div>
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
