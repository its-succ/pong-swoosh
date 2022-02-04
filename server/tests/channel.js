const assert = require('uvu/assert');
const fs = require('fs');
const tempy = require('tempy');
const { addChannel } = require('../channel');
const { test } = require('uvu');

let channelsFilePath;
const defaultChannels = [{ name: 'ch1', id: '1', createdBy: 'user1' }];

test.before.each(() => {
  channelsFilePath = tempy.file({ extension: 'json' });
  fs.writeFileSync(channelsFilePath, JSON.stringify(defaultChannels, null, 4));
});

test('addChannel', () => {
  addChannel('user1', '2', 'ch2', channelsFilePath);
  const actual = require(channelsFilePath);
  assert.equal(actual, [defaultChannels[0], { name: 'ch2', id: '2', createdBy: 'user1' }]);
});

test.run();
