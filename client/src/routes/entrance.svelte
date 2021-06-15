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

let controllerUrl: string | undefined;
let speakerUrl: string | undefined;

type Params = { channelSlug: string };
export let params: Params;

const showEntrance = () => {

  const channelSlug = params.channelSlug;
  const url = location.origin;
  controllerUrl = `${url}/#/contoller/${channelSlug}`;
  speakerUrl = `${url}/#/speaker/${channelSlug}`;

};
</script>

<main>
  <h1>ようこそ！</h1>
  <div>
    <p>URLからコントローラ画面とスピーカ画面を開いてください。</p>
    <p>コントローラ画面では音をポン出しできます。<br/>ポン出ししたい音は視聴ボタンで確認できます。</p>
    <p>スピーカ画面からみんながポン出しした音が再生されます。<br/>環境に合わせてボリュームコントロールで音量を調節してください。</p>
  </div>
  <div>
    <ul>
      <li>コントローラURL:{controllerUrl}</li>
      <li>スピーカーURL:{speakerUrl}</li>
    </ul>
  </div>
  <div>
    <QrCode value={speakerUrl} />
  </div>
</main>
<svelte:window on:load={showEntrance}/>
