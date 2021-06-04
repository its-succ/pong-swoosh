<style>
main {
  text-align: center;
  padding: 1em;
  max-width: 240px;
  margin: 0 auto;
}

h1 {
  color: #ff3e00;
  text-transform: uppercase;
  font-size: 4em;
  font-weight: 100;
}

.warning {
  background-color:lightyellow;
  border: 1px solid red;
}

.warning * {
  display: inline-block;
}

@media (min-width: 640px) {
  main {
    max-width: none;
  }
}
</style>

<script lang="ts">
import { io } from 'socket.io-client';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { SERVER_URL } from '../pong-swoosh';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from 'fontawesome-svelte';

library.add(faExclamationTriangle);

let channelName = '';
let controllerUrl: string | undefined;
let speakerUrl: string | undefined;

const createChannel = async () => {
  const socket = io(SERVER_URL);
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const userId = result.visitorId;

  socket.emit('createChannel', { userId, channelName }, (err, id) => {
    if (err) {
      console.error(err);
      return;
    }
    const url = location.href;
    controllerUrl = `${url}#/contoller/${id}`;
    speakerUrl = `${url}#/speaker/${id}`;
  });
};

const beforeUnload = (event) => {
  if (controllerUrl || speakerUrl) {
    event.preventDefault();
    event.returnValue = `このページを離れると ${channelName} が終了します。よろしいですか？`;
  }
  return event.returnValue;
}
</script>

<main>
  <h1>pong-swoosh</h1>

  <h2>チャンネル作成</h2>
  <label
    >チャンネル名<input type="text" placeholder="チャンネル名" bind:value="{channelName}" /></label>
  <button on:click="{createChannel}">作成</button>
  {#if controllerUrl && speakerUrl}
    <div>
      <ul>
        <li>コントローラURL:{controllerUrl}</li>
        <li>スピーカーURL:{speakerUrl}</li>
      </ul>
    </div>
    <div class="warning">
      <FontAwesomeIcon icon="exclamation-triangle"></FontAwesomeIcon>
      <strong>このページを離れると {channelName} が終了します。ご注意ください。</strong>
    </div>
{/if}
</main>
<svelte:window on:beforeunload={beforeUnload}/>
