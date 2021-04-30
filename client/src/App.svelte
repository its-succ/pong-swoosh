<script lang="ts">
import Router from 'svelte-spa-router';
import Home from './routes/home.svelte';
import Speaker from './routes/speaker.svelte';
import Controller from './routes/controller.svelte';

const routes = {
  '/': Home, // チャンネル作成
  '/contoller/:channelSlug': Controller, // コントローラ
  '/speaker/:channelSlug': Speaker, // スピーカー（リスナー）
//  '*': NotFound,
}
</script>

<Router {routes}/>
