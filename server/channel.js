const { Firestore } = require('@google-cloud/firestore');
const channel = {};

/**
 * チャンネルモジュール
 *
 * チャンネルエンティティのフォーマット
 * { name: "チャンネル名", id: "チャンネルID", createdBy: "チャンネル作成ユーザーID", buttonIds: [...カスタムボタンID] }
 */
module.exports = channel;

const channelDb = () => {
  const firestore = new Firestore();
  return firestore.collection('channel');
};

/**
 * チャンネルを追加する
 *
 * @param {string} userId - ユーザーID
 * @param {string} channelId - チャンネルID
 * @param {string} channelName - チャンネル名
 * @returns {Promise<FirebaseFirestore.WriteResult>} 追加結果
 */
channel.addChannel = (userId, channelId, channelName) => {
  const db = channelDb();
  return db.doc(channelId).set({ name: channelName, createdBy: userId });
};

/**
 * チャンネル名とユーザーIDが一致するチャンネルを取得する
 *
 * @param {string} userId - ユーザーID
 * @param {string} channelName - チャンネル名
 * @returns {Promise<FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>} 一致するチャンネルデータ。見つからない場合は false が戻る
 */
channel.getChannel = async (userId, channelName) => {
  const db = channelDb();
  const snapshot = await db.get();
  for (const doc of snapshot.docs) {
    const ch = doc.data();
    if (ch.name === channelName && ch.createdBy === userId) {
      return { ...ch, id: doc.id };
    }
  }
  return false;
};

/**
 * ユーザーIDが一致するチャンネル一覧を取得する
 *
 * @param {string} userId - ユーザーID
 * @returns {array} チャンネル一覧
 */
channel.listChannel = async (userId) => {
  const db = channelDb();
  const snapshot = await db.get();
  return snapshot.docs
    .filter((doc) => doc.data().createdBy === userId)
    .map((doc) => {
      const ch = doc.data();
      return { ...ch, id: doc.id };
    });
};

/**
 * チャンネル名とユーザーIDが一致するチャンネルを削除する
 *
 * @param {string} userId - ユーザーID
 * @param {string} channelId - チャンネルID
 */
channel.removeChannel = async (userId, channelId) => {
  const db = channelDb();
  const ch = await db.doc(channelId).get();
  if (ch && ch.data().createdBy === userId) {
    await db.doc(channelId).delete();
  }
};

/**
 * チャンネルIDとユーザーIDが一致するチャンネルにカスタムボタン一覧を保存する
 *
 * @param {string} userId - ユーザーID
 * @param {string} channelId - チャンネルID
 * @param {array} buttonIds - 利用するボタンIDの一覧
 */
channel.updateChannel = async (userId, channelId, buttonIds) => {
  const db = channelDb();
  const ch = await db.doc(channelId).get();
  if (ch && ch.data().createdBy === userId) {
    await db.doc(channelId).update({ buttonIds });
  }
};

/**
 * チャンネルIDが一致するカスタムボタンID一覧を取得する
 *
 * @param {string} channelId - チャンネルID
 * @returns カスタムボタンID一覧。設定されていない場合は undefined が戻る
 */
channel.findCustomButtonIdsById = async (channelId) => {
  const db = channelDb();
  const ch = await db.doc(channelId).get();
  if (ch) {
    return ch.data().buttonIds;
  }
  return undefined;
};
