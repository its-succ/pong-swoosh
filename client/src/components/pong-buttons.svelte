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

input + button {
  margin-left: 0;
}
input {
  margin-left: 1rem;
}

</style>
<script lang="ts">
  export let pongButtons = [];
  export let socket = undefined;
  export let selectable = false;
  export let isOverSelected = false;
  let buttons = {};
  let audios = {};
  let selects = {};

  export function selectedButtonIds() {
    return Object.keys(selects).filter((id) => selects[id].checked).map((id) => Number(id));
  }

  const play = (id) => {
    if (socket === undefined) {
      const button = pongButtons.find((p) => p.id === id);
      Object.values<HTMLAudioElement>(audios).find((element) => element.getAttribute('src') === button.url).play();
    } else {
      buttons[id].disabled = true;
      setTimeout(() => (buttons[id].disabled = false), pongButtons.find((p) => p.id === id).duration * 1000);
      socket.emit('pongSwoosh', { id });
    }
  };
  const changeSelect = () => {
    isOverSelected = document.querySelectorAll('.pong-button-choice-selector:checked').length > 8;
  };
</script>

<div class="pong-buttons">
  <ul>
    {#each pongButtons as button}
      <li>
        {#if selectable}
          <input class="pong-button-choice-selector" type="checkbox" bind:this="{selects[button.id]}" on:change="{changeSelect}" checked="{button.default}">
        {/if}
        <button on:click="{() => play(button.id)}" bind:this="{buttons[button.id]}">
          <img src="{button.icon}" alt="icon">
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label>{button.title}</label>
        </button>
        <audio src="{button.url}" bind:this="{audios[button.id]}"></audio>
      </li>
    {/each}
  </ul>
</div>
