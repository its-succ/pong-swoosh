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
import io from 'socket.io-client';

const socket = io('https://pong-swoosh-server.herokuapp.com');
</script>

<main>
  <h1>pong-swoosh</h1>
</main>
