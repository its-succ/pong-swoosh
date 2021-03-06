const fs = require('fs');
const channel = {};
const DEFAULT_CHANNELS_FILE_PATH = './channels.json';

/**
 * チャンネルモジュール
 *
 * チャンネル一覧ファイルのフォーマット
 * [
 *   { name: "チャンネル名", id: "チャンネルID", createdBy: "チャンネル作成ユーザーID" }
 * ]
 */
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

/**
 * チャンネルを追加する
 *
 * @param {string} userId - ユーザーID
 * @param {string} channelId - チャンネルID
 * @param {string} channelName - チャンネル名
 * @param {string} channelsFilePath - チャンネルファイルパス（指定しない場合は `/channels.json`）
 */
channel.addChannel = (
  userId,
  channelId,
  channelName,
  channelsFilePath = DEFAULT_CHANNELS_FILE_PATH
) => {
  const channelsList = require(channelsFilePath);
  channelsList.push({ name: channelName, id: channelId, createdBy: userId });
  saveChannelsFile(channelsFilePath, channelsList);
};

/**
 * チャンネル名とユーザーIDが一致するチャンネルを取得する
 *
 * @param {string} userId - ユーザーID
 * @param {string} channelName - チャンネル名
 * @param {string} channelsFilePath - チャンネルファイルパス（指定しない場合は `/channels.json`）
 */
channel.getChannel = (userId, channelName, channelsFilePath = DEFAULT_CHANNELS_FILE_PATH) => {
  const channelsList = require(channelsFilePath);
  for (let i = 0; i < channelsList.length; i++) {
    if (channelsList[i].name === channelName && channelsList[i].createdBy === userId) {
      return channelsList[i];
    }
  }
  return false;
};

/**
 * ユーザーIDが一致するチャンネル一覧を取得する
 *
 * @param {string} userId - ユーザーID
 * @param {string} channelsFilePath - チャンネルファイルパス（指定しない場合は `/channels.json`）
 * @returns {array} チャンネル一覧
 */
channel.listChannel = (userId, channelsFilePath = DEFAULT_CHANNELS_FILE_PATH) => {
  const channelsList = require(channelsFilePath);
  return channelsList.filter((c) => c.createdBy === userId);
};
