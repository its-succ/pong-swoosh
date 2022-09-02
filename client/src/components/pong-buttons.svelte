<style>
.pong-buttons {
  padding: 2rem;
}

ul, li {
  list-style: none;
}
ul {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  margin: 0;
  padding: 0;
}
li {
  padding: 10px 0;
  align-items: center;
}
button {
  height: 5rem;
  width: 10rem;
  position: relative;
  margin: 1rem;
}
button img {
  padding-left: 6px;
  width: 2rem;
  float: left;
}
button label {
  font-weight: bold;
  font-size: 0.8rem;
  line-height: 2rem;
}

</style>
<script lang="ts">
    export let pongButtons = [];
</script>
<!-- TODO pong-swoosh.svelteのボタンも対応できるようにする -->
<div class="pong-buttons">
    <ul>
      {#each pongButtons as button}
        <li>
          <button>
            <img src="{button.icon}" alt="icon">
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label>{button.title}</label>
          </button>
        </li>
      {/each}
    </ul>
  </div>