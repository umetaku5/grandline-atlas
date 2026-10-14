// 家系図。gen は世代(0 が最も古い)。parents/spouse は同じ家系内の key を参照。
window.OP = window.OP || {};
OP.families = [
  { id: "fam-monkey-d", name: "モンキー・D家と義兄弟", desc: "海軍の英雄ガープ、革命軍のドラゴン、海賊ルフィと、三代そろって世界の行方を左右する血筋。エースとサボはルフィと盃を交わした義兄弟で、血のつながりはない。",
    members: [
      { key: "garp", char: "garp", gen: 0 },
      { key: "dragon", char: "dragon", gen: 1, parents: ["garp"] },
      { key: "luffy", char: "luffy", gen: 2, parents: ["dragon"] },
      { key: "ace", char: "ace", gen: 2, note: "義兄弟(実父はロジャー)" },
      { key: "sabo", char: "sabo", gen: 2, note: "義兄弟" }
    ] },
  { id: "fam-gol-d", name: "ゴール・D家とポートガス家", desc: "海賊王ロジャーと、その子を命がけで産んだルージュ。エースは世間から隠すため母の姓を名乗った。",
    members: [
      { key: "roger", char: "roger", gen: 0, spouse: "rouge" },
      { key: "rouge", char: "rouge", gen: 0, spouse: "roger" },
      { key: "ace", char: "ace", gen: 1, parents: ["roger", "rouge"] }
    ] },
  { id: "fam-charlotte", name: "シャーロット家", desc: "ビッグ・マムことリンリンが築いた大家族。子どもは85人を超え、父親の違う兄弟姉妹が政略結婚の駒として各地に送り出される。ここでは主要な子どもに絞って載せる。",
    members: [
      { key: "big-mom", char: "big-mom", gen: 0 },
      { key: "perospero", char: "perospero", gen: 1, parents: ["big-mom"], note: "長男" },
      { key: "x-compote", name: "シャーロット・コンポート", gen: 1, parents: ["big-mom"], note: "長女" },
      { key: "x-daifuku", name: "シャーロット・ダイフク", gen: 1, parents: ["big-mom"], note: "三つ子の長兄" },
      { key: "oven", char: "oven", gen: 1, parents: ["big-mom"], note: "三つ子" },
      { key: "katakuri", char: "katakuri", gen: 1, parents: ["big-mom"], note: "三つ子" },
      { key: "x-brulee", name: "シャーロット・ブリュレ", gen: 1, parents: ["big-mom"], note: "カタクリの妹" },
      { key: "smoothie", char: "smoothie", gen: 1, parents: ["big-mom"] },
      { key: "cracker", char: "cracker", gen: 1, parents: ["big-mom"] },
      { key: "x-lola", name: "シャーロット・ローラ", gen: 1, parents: ["big-mom"], note: "シフォンと双子" },
      { key: "x-chiffon", name: "シャーロット・シフォン", gen: 1, parents: ["big-mom"], spouse: "bege", note: "ローラと双子" },
      { key: "bege", char: "bege", gen: 1, spouse: "x-chiffon", note: "婿" },
      { key: "x-pez", name: "シャーロット・ペッツ", gen: 2, parents: ["x-chiffon", "bege"] },
      { key: "pudding", char: "pudding", gen: 1, parents: ["big-mom"], note: "三つ目族の血を引く" },
      { key: "x-flampe", name: "シャーロット・フランペ", gen: 1, parents: ["big-mom"] }
    ] },
  { id: "fam-vinsmoke", name: "ヴィンスモーク家", desc: "ジェルマ王国の王族。ジャッジは子どもたちに血統因子の改造を施し、感情を持たない兵器にしようとした。母ソラの抵抗でレイジュとサンジだけが人の心を残した。",
    members: [
      { key: "judge", char: "judge", gen: 0, spouse: "x-sora" },
      { key: "x-sora", name: "ヴィンスモーク・ソラ", gen: 0, spouse: "judge", note: "故人" },
      { key: "reiju", char: "reiju", gen: 1, parents: ["judge", "x-sora"], note: "長女" },
      { key: "ichiji", char: "ichiji", gen: 1, parents: ["judge", "x-sora"], note: "四つ子の長男" },
      { key: "niji", char: "niji", gen: 1, parents: ["judge", "x-sora"], note: "四つ子" },
      { key: "sanji", char: "sanji", gen: 1, parents: ["judge", "x-sora"], note: "四つ子(三男)" },
      { key: "yonji", char: "yonji", gen: 1, parents: ["judge", "x-sora"], note: "四つ子" }
    ] },
  { id: "fam-kozuki", name: "光月家", desc: "ワノ国の将軍家。おでんは開国を志して処刑され、20年後に子のモモの助と日和が国を取り戻した。トキは時を越える力で子どもを未来へ送った。",
    members: [
      { key: "x-sukiyaki", name: "光月スキヤキ", gen: 0, note: "先代将軍" },
      { key: "oden", char: "oden", gen: 1, parents: ["x-sukiyaki"], spouse: "toki" },
      { key: "toki", char: "toki", gen: 1, spouse: "oden" },
      { key: "momonosuke", char: "momonosuke", gen: 2, parents: ["oden", "toki"] },
      { key: "hiyori", char: "hiyori", gen: 2, parents: ["oden", "toki"] }
    ] },
  { id: "fam-kaido", name: "カイドウ親子", desc: "百獣のカイドウと、その一人娘ヤマト。ヤマトはおでんに憧れて自らを「おでん」と名乗り、父に逆らった。",
    members: [
      { key: "kaido", char: "kaido", gen: 0 },
      { key: "yamato", char: "yamato", gen: 1, parents: ["kaido"] }
    ] },
  { id: "fam-nefertari", name: "ネフェルタリ家", desc: "アラバスタ王家。祖先は800年前に世界政府を創った王たちの一つだが、聖地マリージョアへの移住を拒んだ。リリとコブラの間の世代は省略している。",
    members: [
      { key: "x-lili", name: "ネフェルタリ・リリ", gen: 0, note: "約800年前の女王(コブラの祖先)" },
      { key: "cobra", char: "cobra", gen: 1, spouse: "x-titi", note: "リリの子孫" },
      { key: "x-titi", name: "ネフェルタリ・T・ティティ", gen: 1, spouse: "cobra", note: "故人" },
      { key: "vivi", char: "vivi", gen: 2, parents: ["cobra", "x-titi"] }
    ] },
  { id: "fam-donquixote", name: "ドンキホーテ家", desc: "天竜人の家系。父ホーミングが人間として生きる道を選んだことで一家は迫害を受け、兄ドフラミンゴは父を手にかけた。弟ロシナンテは海兵となり兄の前に立ちはだかった。",
    members: [
      { key: "x-homing", name: "ドンキホーテ・ホーミング", gen: 0, note: "元天竜人。長男に殺された" },
      { key: "doflamingo", char: "doflamingo", gen: 1, parents: ["x-homing"], note: "長男" },
      { key: "corazon", char: "corazon", gen: 1, parents: ["x-homing"], note: "次男" }
    ] },
  { id: "fam-figarland", name: "フィガーランド家", desc: "天竜人の名門。ガーリング聖は神の騎士団の元最高司令官で、のちに五老星となった。騎士団を率いるシャムロックはシャンクスと瓜二つの双子とされる。",
    members: [
      { key: "garling", char: "garling", gen: 0 },
      { key: "shamrock", char: "shamrock", gen: 1, parents: ["garling"], note: "シャンクスの双子の兄とされる" },
      { key: "shanks", char: "shanks", gen: 1, parents: ["garling"], note: "ガーリングとの親子関係は作中で示唆。ゴッドバレーでロジャーに拾われた" }
    ] },
  { id: "fam-nico", name: "ニコ家", desc: "オハラの考古学者の母娘。オルビアは歴史の本文を追って島を離れ、バスターコールの日に娘ロビンを逃がして命を落とした。",
    members: [
      { key: "olvia", char: "olvia", gen: 0 },
      { key: "robin", char: "robin", gen: 1, parents: ["olvia"] }
    ] },
  { id: "fam-neptune", name: "リュウグウ王家", desc: "魚人島を治めるネプチューン家。王妃オトヒメは地上との共存を訴え続けて暗殺された。末娘しらほしは古代兵器ポセイドンの力を持つ。",
    members: [
      { key: "neptune", char: "neptune", gen: 0, spouse: "otohime" },
      { key: "otohime", char: "otohime", gen: 0, spouse: "neptune" },
      { key: "x-fukaboshi", name: "フカボシ", gen: 1, parents: ["neptune", "otohime"], note: "長男" },
      { key: "x-ryuboshi", name: "リュウボシ", gen: 1, parents: ["neptune", "otohime"], note: "次男" },
      { key: "x-manboshi", name: "マンボシ", gen: 1, parents: ["neptune", "otohime"], note: "三男" },
      { key: "shirahoshi", char: "shirahoshi", gen: 1, parents: ["neptune", "otohime"], note: "長女" }
    ] },
  { id: "fam-elbaph", name: "エルバフ王家", desc: "巨人族の国エルバフの王家。前王ハラルドは国を変えようとしたが、最期は息子ロキの手で討たれた。",
    members: [
      { key: "harald", char: "harald", gen: 0 },
      { key: "loki", char: "loki", gen: 1, parents: ["harald"] }
    ] },
  { id: "fam-kuma", name: "くまとボニー", desc: "ボニーはジニーが天竜人のもとで身ごもった子で、くまとは血がつながっていない。それでもくまは父として娘を育て、娘のために自分のすべてを差し出した。",
    members: [
      { key: "kuma", char: "kuma", gen: 0, note: "育ての父" },
      { key: "ginny", char: "ginny", gen: 0 },
      { key: "bonney", char: "bonney", gen: 1, parents: ["ginny"], note: "くまが父として育てた" }
    ] },
  { id: "fam-usopp", name: "ウソップ一家", desc: "赤髪海賊団の狙撃手ヤソップは海へ出て、妻バンキーナが故郷で息子を育てた。母は病で亡くなり、ウソップは父を誇りに思いながら育った。",
    members: [
      { key: "yasopp", char: "yasopp", gen: 0, spouse: "x-banchina" },
      { key: "x-banchina", name: "バンキーナ", gen: 0, spouse: "yasopp", note: "故人" },
      { key: "usopp", char: "usopp", gen: 1, parents: ["yasopp", "x-banchina"] }
    ] }
];
