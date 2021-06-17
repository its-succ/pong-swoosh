<script lang="ts">
import Router from 'svelte-spa-router';
import Home from './routes/home.svelte';
import Entrance from './routes/entrance.svelte';
import Speaker from './routes/speaker.svelte';
import Controller from './routes/controller.svelte';

const routes = {
  '/': Home, // チャンネル作成
  '/entrance/:channelSlug/:channelName': Entrance,
  '/contoller/:channelSlug': Controller, // コントローラ
  '/speaker/:channelSlug': Speaker, // スピーカー（リスナー）
  //  '*': NotFound,
};
</script>

<Router routes="{routes}" />
