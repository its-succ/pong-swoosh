<script lang="ts">
import Router from 'svelte-spa-router'
import Home from './routes/home.svelte'
import Speacker from './routes/speaker.svelte'

const routes = {
  '/': Home, // チャンネル作成
//  '/contoller/:channel-slug': Controller, // コントローラ
  '/speaker/:channelSlug': Speaker, // スピーカー（リスナー）
//  '*': NotFound,
}
</script>

<Router {routes}/>
