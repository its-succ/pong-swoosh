const allPongs = [
  {
    id: 1,
    title: '拍手',
    url: 'applause.mp3',
    icon: 'applause.svg',
    duration: 5,
    default: true,
  },
  {
    id: 2,
    title: '納得',
    url: 'understand.mp3',
    icon: 'understand.svg',
    duration: 2,
    default: true,
  },
  {
    id: 3,
    title: '笑い',
    url: 'laugh.mp3',
    icon: 'laugh.svg',
    duration: 4,
    default: true,
  },
  {
    id: 4,
    title: 'えー(驚き)',
    url: 'surprise.mp3',
    icon: 'surprise.svg',
    duration: 1,
    default: true,
  },
  {
    id: 5,
    title: 'おぉ...(感動)',
    url: 'wonder.mp3',
    icon: 'wonder.svg',
    duration: 2,
    default: true,
  },
  {
    id: 6,
    title: 'ドンドンパフパフ',
    url: 'dondonpafupafu.mp3',
    icon: 'dondonpafupafu.png',
    duration: 2,
    default: true,
  },
  {
    id: 7,
    title: 'ドラムロール',
    url: 'drum-roll.mp3',
    icon: 'drum-roll.svg',
    duration: 4,
    default: true,
  },
  {
    id: 8,
    title: 'ドラ',
    url: '/gong.mp3',
    icon: 'gong.svg',
    duration: 5,
    default: true,
  },
  {
    id: 9,
    title: 'へぇー',
    url: 'hee.mp3',
    icon: 'hee.svg',
    duration: 2,
    default: false,
  },
  {
    id: 10,
    title: '見えてます',
    url: 'mietemasu.mp3',
    icon: '/mietemasu.svg',
    duration: 2,
    default: false,
  },
];

/**
 * すべての効果音を取得する
 * @param {string} pongBaseUrl - 効果音素材のベースURL
 * @returns すべての効果音
 */
const getAllPongs = (pongBaseUrl) => {
  return allPongs.map((p) => {
    return {
      ...p,
      url: `${pongBaseUrl}/${p.url}`,
      icon: `${pongBaseUrl}/${p.icon}`,
    };
  });
};

/**
 * 有効な効果音を取得する,
 * デフォルトでは、効果音のデフォルトボタン一覧が戻るが、カスタムIDが指定されている場合は、そのボタンのみが戻る
 * @param {string} pongBaseUrl - 効果音素材のベースURL
 * @param {array} customIds - 選択状態がカスタマイズされている場合は、ボタンのIDが配列で指定される
 * @returns 有効な効果音
 */
const getChannelPongs = (pongBaseUrl, customIds) => {
  return allPongs
    .filter((p) => {
      if (customIds instanceof Array && customIds.length > 0) {
        return customIds.map((id) => Number(id)).includes(p.id);
      }
      return p.default;
    })
    .map((p) => {
      return {
        ...p,
        url: `${pongBaseUrl}/${p.url}`,
        icon: `${pongBaseUrl}/${p.icon}`,
      };
    });
};

module.exports = {
  getAllPongs,
  getChannelPongs,
};
