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

@media (min-width: 640px) {
  main {
    max-width: none;
  }
}

.contents {
  padding: 0 40px;
}

h1 {
  font-size: 1.6rem;
}

h2 {
  font-size: 1rem;
  font-weight: normal;
}

h3 {
  font-size: 1.6rem;
}

h3 .text {
  display: inline-block;
  vertical-align: top;
  margin-top: 10px;
  padding-left: 2rem;
}

section {
  margin-top: 2rem;
  display: flex;
  justify-content: space-around;
  padding: 0;
}

article {
  padding: 0 30px;
  box-shadow: 2px 2px 8px gray;
  margin-right: 20px;
}

article + article {
  margin-left: 20px;
  margin-right: 0;
}

.qr {
  display: block;
  text-align: center;
}
</style>

<script lang="ts">
import '@material/mwc-top-app-bar';
import QrCode from 'svelte-qrcode';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGamepad, faHeadphones } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from 'fontawesome-svelte';

library.add(faGamepad, faHeadphones);

let channelName: string | undefined;
let controllerUrl: string | undefined;
let speakerUrl: string | undefined;

type Params = { channelSlug: string; channelName: string };
export let params: Params;

const showEntrance = () => {
  const channelSlug = params.channelSlug;
  channelName = params.channelName;
  const url = location.origin + location.pathname;
  controllerUrl = `${url}/#/contoller/${channelSlug}`;
  speakerUrl = `${url}/#/speaker/${channelSlug}`;
};
</script>

<main>
  <mwc-top-app-bar prominent centerTitle>
    <div slot="title">
      pong-swoosh
      <div class="subtitle">リモートポン出しWebシステム - Pong (っ’-‘)╮ =͟͟͞͞ 🎉</div>
    </div>
    <div class="contents">
      <h1>チャンネル「{channelName}」へようこそ</h1>
      <h2>
        pong-swooshは、Web会議システムを利用しながら効果音を送受信して、盛り上がりを共有するシステムです
      </h2>
      <section>
        <article>
          <h3>
            <FontAwesomeIcon icon="{faGamepad}" size="2x" /><span class="text">コントローラ</span>
          </h3>
          <p class="qr"><QrCode value="{controllerUrl}" /></p>
          <a href="{controllerUrl}">{controllerUrl}</a>
          <p>
            コントローラ画面から効果音をポン出しできます。<br />効果音は視聴ボタンで確認できます。
          </p>
        </article>
        <article>
          <h3>
            <FontAwesomeIcon icon="{faHeadphones}" size="2x" /><span class="text">スピーカー</span>
          </h3>
          <p class="qr"><QrCode value="{speakerUrl}" /></p>
          <a href="{speakerUrl}">{speakerUrl}</a>
          <p>
            スピーカ画面からみんながポン出しした音が再生されます。<br />画面のボリュームコントロールで音量を調節してください。
          </p>
        </article>
      </section>
    </div>
  </mwc-top-app-bar>
</main>
<svelte:window on:load="{showEntrance}" />
