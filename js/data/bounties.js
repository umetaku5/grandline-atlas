// 懸賞金の推移。arc はその金額が判明した編。
window.OP = window.OP || {};
OP.bounties = [
  // ===== 麦わらの一味 =====
  { char: "luffy", history: [ { arc: "arlong-park", value: 30000000 }, { arc: "jaya", value: 100000000 }, { arc: "enies-lobby", value: 300000000 }, { arc: "return-sabaody", value: 400000000 }, { arc: "dressrosa", value: 500000000 }, { arc: "reverie", value: 1500000000 }, { arc: "wano", value: 3000000000 } ] },
  { char: "zoro", history: [ { arc: "jaya", value: 60000000 }, { arc: "enies-lobby", value: 120000000 }, { arc: "dressrosa", value: 320000000 }, { arc: "wano", value: 1111000000 } ] },
  { char: "nami", history: [ { arc: "enies-lobby", value: 16000000 }, { arc: "dressrosa", value: 66000000 }, { arc: "wano", value: 366000000 } ] },
  { char: "usopp", history: [ { arc: "enies-lobby", value: 30000000 }, { arc: "dressrosa", value: 200000000 }, { arc: "wano", value: 500000000 } ] },
  { char: "sanji", history: [ { arc: "enies-lobby", value: 77000000 }, { arc: "dressrosa", value: 177000000 }, { arc: "reverie", value: 330000000 }, { arc: "wano", value: 1032000000 } ] },
  { char: "chopper", history: [ { arc: "enies-lobby", value: 50 }, { arc: "dressrosa", value: 100 }, { arc: "wano", value: 1000 } ] },
  { char: "robin", history: [ { arc: "alabasta", value: 79000000 }, { arc: "enies-lobby", value: 80000000 }, { arc: "dressrosa", value: 130000000 }, { arc: "wano", value: 930000000 } ] },
  { char: "franky", history: [ { arc: "enies-lobby", value: 44000000 }, { arc: "dressrosa", value: 94000000 }, { arc: "wano", value: 394000000 } ] },
  { char: "brook", history: [ { arc: "thriller-bark", value: 33000000 }, { arc: "dressrosa", value: 83000000 }, { arc: "wano", value: 383000000 } ] },
  { char: "jinbe", history: [ { arc: "reverie", value: 438000000 }, { arc: "wano", value: 1100000000 } ] },
  // ===== 四皇・伝説の海賊 =====
  { char: "roger", history: [ { arc: "wano", value: 5564800000 } ] },
  { char: "whitebeard", history: [ { arc: "wano", value: 5046000000 } ] },
  { char: "kaido", history: [ { arc: "wano", value: 4611100000 } ] },
  { char: "big-mom", history: [ { arc: "wano", value: 4388000000 } ] },
  { char: "shanks", history: [ { arc: "wano", value: 4048900000 } ] },
  { char: "blackbeard", history: [ { arc: "wano", value: 2247600000 }, { arc: "egghead", value: 3996000000 } ] },
  { char: "marco", history: [ { arc: "wano", value: 1374000000 } ] },
  { char: "ace", history: [ { arc: "marineford", value: 550000000 } ] },
  { char: "sabo", history: [ { arc: "reverie", value: 602000000 } ] },
  { char: "fisher-tiger", history: [ { arc: "fishman-island", value: 230000000 } ] },
  // ===== クロスギルド =====
  { char: "buggy", history: [ { arc: "orange-town", value: 15000000 }, { arc: "egghead", value: 3189000000 } ] },
  { char: "mihawk", history: [ { arc: "egghead", value: 3590000000 } ] },
  { char: "crocodile", history: [ { arc: "egghead", value: 1965000000 } ] },
  // ===== 最悪の世代 =====
  { char: "law", history: [ { arc: "sabaody", value: 200000000 }, { arc: "dressrosa", value: 500000000 }, { arc: "wano", value: 3000000000 } ] },
  { char: "kid", history: [ { arc: "sabaody", value: 315000000 }, { arc: "wano", value: 470000000 }, { arc: "wano", value: 3000000000 } ] },
  { char: "killer", history: [ { arc: "sabaody", value: 162000000 }, { arc: "wano", value: 200000000 } ] },
  { char: "hawkins", history: [ { arc: "sabaody", value: 249000000 }, { arc: "wano", value: 320000000 } ] },
  { char: "drake", history: [ { arc: "sabaody", value: 222000000 } ] },
  { char: "apoo", history: [ { arc: "sabaody", value: 198000000 }, { arc: "wano", value: 350000000 } ] },
  { char: "bege", history: [ { arc: "sabaody", value: 138000000 }, { arc: "whole-cake", value: 350000000 } ] },
  { char: "urouge", history: [ { arc: "sabaody", value: 108000000 } ] },
  { char: "bonney", history: [ { arc: "sabaody", value: 140000000 }, { arc: "egghead", value: 320000000 } ] },
  // ===== 元七武海 =====
  { char: "hancock", history: [ { arc: "amazon-lily", value: 80000000 }, { arc: "egghead", value: 1659000000 } ] },
  { char: "moria", history: [ { arc: "thriller-bark", value: 320000000 } ] },
  { char: "doflamingo", history: [ { arc: "dressrosa", value: 340000000 } ] },
  { char: "kuma", history: [ { arc: "egghead", value: 296000000 } ] },
  // ===== 麦わら大船団・その他 =====
  { char: "cavendish", history: [ { arc: "dressrosa", value: 330000000 } ] },
  { char: "bartolomeo", history: [ { arc: "dressrosa", value: 150000000 }, { arc: "dressrosa", value: 200000000 } ] },
  { char: "pedro", history: [ { arc: "zou", value: 382000000 } ] },
  // ===== ビッグ・マム海賊団 =====
  { char: "katakuri", history: [ { arc: "whole-cake", value: 1057000000 } ] },
  { char: "smoothie", history: [ { arc: "whole-cake", value: 932000000 } ] },
  { char: "cracker", history: [ { arc: "whole-cake", value: 860000000 } ] },
  { char: "perospero", history: [ { arc: "whole-cake", value: 700000000 } ] },
  // ===== 百獣海賊団 =====
  { char: "king", history: [ { arc: "wano", value: 1390000000 } ] },
  { char: "queen", history: [ { arc: "wano", value: 1320000000 } ] },
  { char: "jack", history: [ { arc: "zou", value: 1000000000 } ] },
  { char: "whos-who", history: [ { arc: "wano", value: 546000000 } ] },
  // ===== 東の海の海賊 =====
  { char: "kuro", history: [ { arc: "syrup-village", value: 16000000 } ] },
  { char: "krieg", history: [ { arc: "baratie", value: 17000000 } ] },
  { char: "arlong", history: [ { arc: "arlong-park", value: 20000000 } ] }
];
