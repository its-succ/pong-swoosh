const assert = require('uvu/assert');
const {
  addChannel,
  getChannel,
  findCustomButtonIdsById,
  listChannel,
  removeChannel,
  updateChannel,
} = require('../channel');
const { test } = require('uvu');
const { Firestore } = require('@google-cloud/firestore');

const defaultChannel = { name: 'ch1', id: '1', createdBy: 'user1' };
const firestore = new Firestore();

test.before.each(async () => {
  const { name, createdBy } = defaultChannel;
  await firestore.collection('channel').doc(defaultChannel.id).set({ name, createdBy });
});

test.after.each(async () => {
  const snapshot = await firestore.collection('channel').get();
  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
});

test('addChannel', async () => {
  await addChannel('user1', '2', 'ch2');
  const actual = await firestore.collection('channel').doc('2').get();
  assert.equal(actual.data(), { name: 'ch2', createdBy: 'user1' });
});

((getChannel) => {
  test('チャンネル名とユーザーIDが一致するチャンネルが取得できる', async () => {
    const actual = await getChannel('user1', 'ch1');
    assert.equal(actual, defaultChannel);
  });

  test('チャンネル名が一致しない場合はfalseが戻る', async () => {
    const actual = await getChannel('user1', 'hoge');
    assert.equal(actual, false);
  });

  test('ユーザーIDが一致しない場合はfalseが戻る', async () => {
    const actual = await getChannel('hoge', 'ch1');
    assert.equal(actual, false);
  });
})(getChannel);

((listChannel) => {
  test('ユーザーIDが一致するチャンネル一覧が取得できる', async () => {
    await addChannel('user1', '2', 'ch2');
    await addChannel('user2', '3', 'ch1');
    const actual = await listChannel('user1');
    assert.equal(actual, [defaultChannel, { name: 'ch2', id: '2', createdBy: 'user1' }]);
  });

  test('一致するものがない場合は空配列が戻る', async () => {
    const actual = await listChannel('hoge');
    assert.equal(actual, []);
  });
})(listChannel);

((removeChannel) => {
  test('チャンネル名とユーザーIDが一致するチャンネルが削除できる', async () => {
    await removeChannel('user1', '1');
    const actual = await firestore.collection('channel').doc('1').get();
    assert.equal(actual.data(), undefined);
  });
})(removeChannel);

((updateChannel) => {
  test('チャンネルIDとユーザーIDが一致するチャンネルにカスタムボタンを更新できる', async () => {
    await updateChannel('user1', '1', [1, 3, 4, 5, 9, 10]);
    const actual = await firestore.collection('channel').doc('1').get();
    assert.equal(actual.data(), {
      name: 'ch1',
      createdBy: 'user1',
      buttonIds: [1, 3, 4, 5, 9, 10],
    });
  });
})(updateChannel);

((findCustomButtonIdsById) => {
  test('カスタムボタン一覧が設定されていない場合はundefinedになる', async () => {
    const actual = await findCustomButtonIdsById('1');
    assert.equal(actual, undefined);
  });

  test('チャンネルIDが一致するカスタムボタン一覧が取得できる', async () => {
    await updateChannel('user1', '1', [1, 3, 4, 5, 9, 10]);
    const actual = await findCustomButtonIdsById('1');
    assert.equal(actual, [1, 3, 4, 5, 9, 10]);
  });
})(findCustomButtonIdsById);

test.run();
