<script lang="ts">
import * as io from "socket.io-client"
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Jumper } from 'svelte-loading-spinners'

async function signIn() {
  const socket = io('https://pong-swoosh-server.herokuapp.com/');
  const channelSlug = params.channelSlug;
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const visitorId = result.visitorId;
  await io.emit('signIn', {userName: visitorId, channelSlug});
}

	// Server config
	var iosocket = io.connect("http://tellki.herokuapp.com", {'sync disconnect on unload': true});

	$('#sign-in').on('submit', function(event) {
		event.preventDefault();

		iosocket.emit('signIn', {
			userName: $('#user-name').val(),
			channelName: $('#channel').val()
		});
	});

	$('#message-to-send').keypress(function(e) {
		if(e.which === 13) {
			iosocket.emit('sendMessage', $('#message-to-send').val());
			$('#message-to-send').val('');
		}
	});

	iosocket.on("userSignedIn", function(username, channel) {
		$("#intro-description").hide();
		$("#sign-in-container").hide();
		$("#chat").fadeIn();
		$("#chat-messages-list").append("<li class='message-item text-success'>" + username + " has signed in.</li>");
		$("#channel-name-tab").text('#' + channel);
	});

	iosocket.on("sendMessageToClients", function(username, message) {
		$("#chat-messages-list").append("<li class='message-item'>" + username + ": " + message + "</li>");
		$("#chat-messages").animate({scrollTop: $("#chat-messages").prop('scrollHeight')}, 50);
	});

	iosocket.on("updateConnectedUsers", function(connectedUsers) {
		$("#number-of-users").text(connectedUsers.length);
		$("#connected-users-list").text('');
		$.each(connectedUsers, function(connectedUser, username) {
			$("#connected-users-list").append("<li id='" + username + "' class='connected-user-item'>" + username + "</li>");
		});
	});

	iosocket.on("clientDisco", function(username) {
		$("#chat-messages-list").append("<li class='message-item text-error'>" + username + " has signed out.</li>");
	});

});
</script>

<main>
{#await signIn()}
  <!-- promise is pending -->
  <p>waiting for the promise to resolve...</p>
{:then value}
  <h1>スピーカー画面</h1>
{:catch error}
  <h1>接続できませんでした</h1>
{/await}
</main>
