<script lang="ts">
import Router from 'svelte-spa-router'
import Home from './routes/home.svelte'

const routes = {
  '/': Home, // チャンネル作成
//  '/contoller/:channel-slug': Controller, // コントローラ
//  '/speaker/:channel-slug': Speaker, // スピーカー（リスナー）
//  '*': NotFound,
}
</script>

<Router {routes}/>
