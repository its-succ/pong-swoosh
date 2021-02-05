const fs = require('fs');
const channel = {};

module.exports = channel;

const saveChannelsFile = (channelsFilePath, channels) => {
  fs.writeFile(channelsFilePath, JSON.stringify(channels, null, 4), (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Channels list updated.');
    }
  });
};

channel.addChannel = (channelsFilePath, channelNameToAdd) => {
  console.log('Creating #' + channelNameToAdd);
  const channelsList = require(channelsFilePath);
  channelsList.push({ name: channelNameToAdd });
  saveChannelsFile(channelsFilePath, channelsList);
};

channel.getChannel = (channelsFilePath, channelName) => {
  const channelsList = require(channelsFilePath);
  for (let i = 0; i < channelsList.length; i++) {
    if (channelsList[i].name === channelName) {
      return channelsList[i];
    }
  }
  return false;
};
