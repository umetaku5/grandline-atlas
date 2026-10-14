// 勢力。parent で階層化。color は未指定なら親の色を継承する。
// kind: "category"(分類のための見出し) | "group"(実在の組織)
window.OP = window.OP || {};
OP.factions = [
  // ---- 分類 ----
  { id: "pirates", name: "海賊", kind: "category", color: "#c0392b", desc: "海を自由に航海し、略奪や冒険を行う者たち。賞金首として世界政府に追われる。" },
  { id: "world-gov", name: "世界政府", kind: "category", color: "#2c5aa0", desc: "800年前に20の王国が創設した、170以上の加盟国を束ねる世界最大の組織。" },
  { id: "revolutionary-army", name: "革命軍", kind: "group", color: "#2e8b57", desc: "モンキー・D・ドラゴン率いる、世界政府の打倒を目指す組織。本部はバルティゴ(後に移転)。" },
  { id: "kingdoms", name: "王国・国家", kind: "category", color: "#b8860b", desc: "世界政府加盟国・非加盟国を含む各地の国々。" },
  { id: "others", name: "その他・独立勢力", kind: "category", color: "#7f8c8d", desc: "どの陣営にも属さない人物や組織。" },

  // ---- 世界政府 ----
  { id: "five-elders", name: "五老星", parent: "world-gov", kind: "group", color: "#1b3a6b", desc: "世界政府の最高権力者とされる5人の老人。実はさらに上にイム様が存在する。" },
  { id: "imu-and-knights", name: "イム様と神の騎士団", parent: "world-gov", kind: "group", color: "#0f2347", desc: "聖地マリージョアの「虚の玉座」に座る謎の存在イムと、天竜人による神の騎士団。" },
  { id: "celestial-dragons", name: "天竜人", parent: "world-gov", kind: "group", color: "#3a6cc6", desc: "世界政府を創設した20人の王の末裔。マリージョアに住み、絶大な特権を持つ。" },
  { id: "marines", name: "海軍", parent: "world-gov", kind: "group", color: "#2f80ed", desc: "世界政府の軍事組織。「正義」を掲げ海賊を取り締まる。本部はマリンフォード(後に移転)。" },
  { id: "sword", name: "SWORD", parent: "marines", kind: "group", desc: "海軍を一時的に除籍した者で構成される秘密部隊。コビーやドレークが所属。" },
  { id: "cipher-pol", name: "サイファーポール(CP)", parent: "world-gov", kind: "group", color: "#34495e", desc: "世界政府直属の諜報機関。CP1〜CP9と最上位のCP-0がある。" },
  { id: "cp9", name: "CP9", parent: "cipher-pol", kind: "group", desc: "表向き存在しない暗殺部隊。エニエス・ロビー編の敵。" },
  { id: "cp0", name: "CP-0", parent: "cipher-pol", kind: "group", desc: "天竜人直属の最強の諜報機関。" },
  { id: "impel-down-staff", name: "インペルダウン看守", parent: "world-gov", kind: "group", desc: "海底大監獄インペルダウンの職員たち。" },
  { id: "seven-warlords", name: "王下七武海", parent: "world-gov", kind: "group", color: "#5b6fa8", desc: "政府に公認された7人の海賊。世界会議(レヴェリー)の決定で制度は撤廃された。" },

  // ---- 海賊: 四皇・大勢力 ----
  { id: "yonko", name: "四皇", parent: "pirates", kind: "category", color: "#8e1b1b", desc: "新世界に君臨する4人の大海賊。時代によって顔ぶれが変わる。" },
  { id: "roger-pirates", name: "ロジャー海賊団", parent: "pirates", kind: "group", color: "#6d4c41", desc: "海賊王ゴール・D・ロジャーの船。唯一ラフテルに到達した。" },
  { id: "rocks-pirates", name: "ロックス海賊団", parent: "pirates", kind: "group", color: "#4a235a", desc: "38年前に存在した伝説の海賊団。ゴッドバレー事件で壊滅した。" },
  { id: "straw-hat-pirates", name: "麦わらの一味", parent: "pirates", kind: "group", color: "#e74c3c", desc: "モンキー・D・ルフィ率いる海賊団。本作の主人公たち。" },
  { id: "straw-hat-grand-fleet", name: "麦わら大船団", parent: "straw-hat-pirates", kind: "group", color: "#f1948a", desc: "ドレスローザ編後に一方的に傘下を名乗った7つの海賊団の連合。" },
  { id: "red-hair-pirates", name: "赤髪海賊団", parent: "yonko", kind: "group", color: "#a93226", desc: "四皇シャンクス率いる海賊団。" },
  { id: "whitebeard-pirates", name: "白ひげ海賊団", parent: "yonko", kind: "group", color: "#d4ac0d", desc: "「世界最強の男」エドワード・ニューゲート率いた海賊団。頂上戦争後に崩壊。" },
  { id: "beasts-pirates", name: "百獣海賊団", parent: "yonko", kind: "group", color: "#7d3c98", desc: "四皇カイドウ率いた海賊団。ワノ国を支配したが敗北。" },
  { id: "big-mom-pirates", name: "ビッグ・マム海賊団", parent: "yonko", kind: "group", color: "#e84393", desc: "四皇シャーロット・リンリン率いた海賊団。万国(トットランド)を支配。" },
  { id: "blackbeard-pirates", name: "黒ひげ海賊団", parent: "yonko", kind: "group", color: "#2d3436", desc: "マーシャル・D・ティーチ率いる海賊団。白ひげの死後に台頭し四皇となった。" },
  { id: "cross-guild", name: "クロスギルド", parent: "pirates", kind: "group", color: "#cf6a00", desc: "バギー・クロコダイル・ミホークが結成した組織。海兵に懸賞金をかける。" },
  { id: "worst-generation", name: "最悪の世代", parent: "pirates", kind: "category", color: "#c0392b", desc: "シャボンディ諸島に集結した、ルフィを含む11人の超新星。" },
  { id: "heart-pirates", name: "ハートの海賊団", parent: "worst-generation", kind: "group", color: "#f39c12", desc: "トラファルガー・ロー率いる海賊団。" },
  { id: "kid-pirates", name: "キッド海賊団", parent: "worst-generation", kind: "group", color: "#922b21", desc: "ユースタス・キッド率いる海賊団。" },
  { id: "donquixote-pirates", name: "ドンキホーテ海賊団", parent: "pirates", kind: "group", color: "#e91e63", desc: "ドフラミンゴ率いた海賊団。ドレスローザを支配し、闇のブローカー「ジョーカー」として暗躍。" },
  { id: "baroque-works", name: "バロックワークス", parent: "pirates", kind: "group", color: "#a0522d", desc: "クロコダイルが社長(Mr.0)を務めた秘密犯罪会社。アラバスタ乗っ取りを狙った。" },
  { id: "buggy-pirates", name: "バギー海賊団", parent: "pirates", kind: "group", color: "#e67e22", desc: "道化のバギー率いる海賊団。" },
  { id: "arlong-pirates", name: "アーロン一味", parent: "pirates", kind: "group", color: "#16a085", desc: "魚人アーロン率いた海賊団。東の海でココヤシ村を支配した。" },
  { id: "sun-pirates", name: "タイヨウの海賊団", parent: "pirates", kind: "group", color: "#e67e22", desc: "フィッシャー・タイガーが結成した魚人・人魚の海賊団。" },
  { id: "kuja-pirates", name: "九蛇海賊団", parent: "pirates", kind: "group", color: "#c2185b", desc: "女ヶ島アマゾン・リリーの女戦士たちの海賊団。船長はボア・ハンコック。" },
  { id: "thriller-bark-pirates", name: "スリラーバーク海賊団", parent: "pirates", kind: "group", color: "#5d6d7e", desc: "ゲッコー・モリア率いた海賊団。" },
  { id: "rumbar-pirates", name: "ルンバー海賊団", parent: "pirates", kind: "group", desc: "ブルックがかつて所属した音楽好きの海賊団。ラブーンの仲間。" },
  { id: "other-pirates", name: "その他の海賊", parent: "pirates", kind: "group", desc: "上記に分類しない海賊たち。" },

  // ---- 王国・国家 ----
  { id: "alabasta-kingdom", name: "アラバスタ王国", parent: "kingdoms", kind: "group", desc: "偉大なる航路の砂漠の大国。ネフェルタリ家が治める。" },
  { id: "wano-country", name: "ワノ国", parent: "kingdoms", kind: "group", color: "#b03a2e", desc: "世界政府非加盟の鎖国国家。侍が守る。光月家が治めていた。" },
  { id: "kozuki-family", name: "光月家と赤鞘九人男", parent: "wano-country", kind: "group", desc: "ワノ国の将軍家・光月おでんとその家臣たち。" },
  { id: "dressrosa-kingdom", name: "ドレスローザ王国", parent: "kingdoms", kind: "group", desc: "愛と情熱とオモチャの国。リク王家が治める。" },
  { id: "ryugu-kingdom", name: "リュウグウ王国", parent: "kingdoms", kind: "group", desc: "魚人島を治める海底の王国。ネプチューン王家。" },
  { id: "mink-tribe", name: "ミンク族(モコモ公国)", parent: "kingdoms", kind: "group", desc: "巨象ズニーシャの背に暮らすミンク族の国。" },
  { id: "drum-kingdom", name: "サクラ王国(旧ドラム王国)", parent: "kingdoms", kind: "group", desc: "冬島の国。ワポルの圧政後、ドルトンが王に。" },
  { id: "elbaph-giants", name: "エルバフの巨人族", parent: "kingdoms", kind: "group", color: "#8d6e63", desc: "戦士の国エルバフに住む巨人族。" },
  { id: "skypiea-people", name: "空島の人々", parent: "kingdoms", kind: "group", desc: "スカイピアとその周辺に住む空の民とシャンディア。" },
  { id: "germa-66", name: "ジェルマ66", parent: "kingdoms", kind: "group", color: "#00838f", desc: "国土を持たない海遊国家ジェルマ王国の軍隊。ヴィンスモーク家が率いる。" },

  // ---- その他 ----
  { id: "egghead-lab", name: "エッグヘッドの研究所", parent: "others", kind: "group", color: "#00a8a8", desc: "天才科学者ベガパンクとその分身(サテライト)たち。" },
  { id: "civilians", name: "一般人・その他", parent: "others", kind: "group", desc: "特定の組織に属さない人物。" }
];
