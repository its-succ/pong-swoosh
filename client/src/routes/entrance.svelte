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

@media (min-width: 640px) {
  main {
    max-width: none;
  }
}
</style>

<script lang="ts">

import QrCode from "svelte-qrcode"

import qs from 'qs'
import { querystring } from 'svelte-spa-router'

$: parsed = qs.parse($querystring)

let channelName: string | undefined;
let controllerUrl: string | undefined;
let speakerUrl: string | undefined;

type Params = { channelSlug: string };
export let params: Params;

const showEntrance = () => {

  channelName = parsed.name;
  const channelSlug = params.channelSlug;
  const url = location.origin;
  controllerUrl = `${url}/#/contoller/${channelSlug}`;
  speakerUrl = `${url}/#/speaker/${channelSlug}`;

};
</script>

<main>
  <h1>ようこそ！ pong-swooshへ！</h1>
  <h2>チャンネル名: {channelName}</h2>
  <div>
    <p>QRコードかURLからコントローラ画面とスピーカ画面を開いてください。</p>
  </div>
  <div>
    <h3>コントローラ画面</h3>
    <p>URL:{controllerUrl}</p>
    <QrCode value={controllerUrl} />
    <p>コントローラ画面では音をポン出しできます。<br/>ポン出ししたい音は視聴ボタンで確認できます。</p>
  </div>

  <div>
    <h3>スピーカー画面</h3>
    <p>URL:{speakerUrl}</p>
    <QrCode value={speakerUrl} />
    <p>スピーカ画面からみんながポン出しした音が再生されます。<br/>画面のボリュームコントロールで音量を調節してください。</p>
  </div>
</main>
<svelte:window on:load={showEntrance}/>
