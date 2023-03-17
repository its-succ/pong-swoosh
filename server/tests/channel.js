const assert = require('uvu/assert');
const fs = require('fs');
const tempy = require('tempy');
const {
  addChannel,
  getChannel,
  findCustomButtonIdsById,
  listChannel,
  removeChannel,
  updateChannel,
} = require('../channel');
const { test } = require('uvu');

let channelsFilePath;
const defaultChannels = [{ name: 'ch1', id: '1', createdBy: 'user1' }];

test.before.each(() => {
  channelsFilePath = tempy.file({ extension: 'json' });
  fs.writeFileSync(channelsFilePath, JSON.stringify(defaultChannels, null, 4));
});

test.after.each(() => {
  fs.rmSync(channelsFilePath);
});

test('addChannel', () => {
  addChannel('user1', '2', 'ch2', channelsFilePath);
  const actual = require(channelsFilePath);
  assert.equal(actual, [defaultChannels[0], { name: 'ch2', id: '2', createdBy: 'user1' }]);
});

((getChannel) => {
  test('チャンネル名とユーザーIDが一致するチャンネルが取得できる', () => {
    const actual = getChannel('user1', 'ch1', channelsFilePath);
    assert.equal(actual, defaultChannels[0]);
  });

  test('チャンネル名が一致しない場合はfalseが戻る', () => {
    const actual = getChannel('user1', 'hoge', channelsFilePath);
    assert.equal(actual, false);
  });

  test('ユーザーIDが一致しない場合はfalseが戻る', () => {
    const actual = getChannel('hoge', 'ch1', channelsFilePath);
    assert.equal(actual, false);
  });
})(getChannel);

((listChannel) => {
  test('ユーザーIDが一致するチャンネル一覧が取得できる', () => {
    addChannel('user1', '2', 'ch2', channelsFilePath);
    addChannel('user2', '3', 'ch1', channelsFilePath);
    const actual = listChannel('user1', channelsFilePath);
    assert.equal(actual, [defaultChannels[0], { name: 'ch2', id: '2', createdBy: 'user1' }]);
  });

  test('一致するものがない場合は空配列が戻る', () => {
    const actual = listChannel('hoge', channelsFilePath);
    assert.equal(actual, []);
  });
})(listChannel);

((removeChannel) => {
  test('チャンネル名とユーザーIDが一致するチャンネルが削除できる', () => {
    removeChannel('user1', '1', channelsFilePath);
    const actual = require(channelsFilePath);
    assert.equal(actual, []);
  });
})(removeChannel);

((updateChannel) => {
  test('チャンネルIDとユーザーIDが一致するチャンネルにカスタムボタンを更新できる', () => {
    updateChannel('user1', '1', [1, 3, 4, 5, 9, 10], channelsFilePath);
    const actual = require(channelsFilePath);
    assert.equal(actual, [{ ...defaultChannels[0], buttonIds: [1, 3, 4, 5, 9, 10] }]);
  });
})(updateChannel);

((findCustomButtonIdsById) => {
  test('カスタムボタン一覧が設定されていない場合はundefinedになる', () => {
    const actual = findCustomButtonIdsById('1', channelsFilePath);
    assert.equal(actual, undefined);
  });

  test('チャンネルIDが一致するカスタムボタン一覧が取得できる', () => {
    updateChannel('user1', '1', [1, 3, 4, 5, 9, 10], channelsFilePath);
    const actual = findCustomButtonIdsById('1', channelsFilePath);
    assert.equal(actual, [1, 3, 4, 5, 9, 10]);
  });
})(findCustomButtonIdsById);


test.run();
