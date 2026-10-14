// 役職の変遷。since/until は arc ID(読者が知った時点)、null は物語開始前/現在。
window.OP = window.OP || {};
OP.positions = [
  { id: "pos-yonko", name: "四皇", desc: "新世界に君臨する4人の大海賊。正式な役職ではなく、世間と政府がその力を認めて呼ぶ称号。誰かが倒れるとすぐに席が入れ替わる。", seats: 4,
    holders: [
      { char: "whitebeard", since: null, until: "marineford", note: "頂上戦争で死亡" },
      { char: "kaido", since: null, until: "wano", note: "鬼ヶ島でルフィに敗北" },
      { char: "big-mom", since: null, until: "wano", note: "鬼ヶ島でキッドとローに敗北" },
      { char: "shanks", since: null, until: null },
      { char: "blackbeard", since: "fishman-island", until: null, note: "白ひげの縄張りを奪い、2年の間に四皇と呼ばれるようになった" },
      { char: "luffy", since: "wano", until: null, note: "カイドウ撃破の後、新たな四皇として手配" },
      { char: "buggy", since: "wano", until: null, note: "クロスギルド結成と周囲の誤解から四皇扱いに" }
    ] },
  { id: "pos-warlords", name: "王下七武海", desc: "世界政府に海賊行為を公認された7人の海賊。政府に協力する見返りに懸賞金が凍結される。レヴェリーでの決議により制度そのものが撤廃された。", seats: 7,
    holders: [
      { char: "crocodile", since: null, until: "alabasta", note: "アラバスタ乗っ取り計画が露見し称号剥奪" },
      { char: "mihawk", since: null, until: "reverie", note: "制度撤廃まで在籍" },
      { char: "kuma", since: null, until: "reverie", note: "改造後も政府の兵器として在籍" },
      { char: "moria", since: null, until: "reverie" },
      { char: "doflamingo", since: null, until: "dressrosa", note: "ドレスローザで敗れ称号剥奪" },
      { char: "hancock", since: null, until: "reverie" },
      { char: "jinbe", since: null, until: "impel-down", note: "白ひげ側につくため称号を返上し投獄" },
      { char: "blackbeard", since: "thriller-bark", until: "impel-down", note: "空席を埋めて加盟し、インペルダウン襲撃で返上" },
      { char: "law", since: "return-sabaody", until: "dressrosa", note: "2年の間に加盟。ドレスローザの後に剥奪" },
      { char: "buggy", since: "post-war", until: "reverie", note: "インペルダウン脱獄後に加盟" }
    ] },
  { id: "pos-admirals", name: "海軍大将", desc: "元帥に次ぐ海軍の最高戦力。原則3人で、いずれも自然系や強力な能力を持つ怪物ぞろい。", seats: 3,
    holders: [
      { char: "aokiji", since: "long-ring", until: "post-war", note: "元帥の座を賭けた赤犬との決闘に敗れ海軍を去る" },
      { char: "akainu", since: "enies-lobby", until: "post-war", note: "元帥に昇格" },
      { char: "kizaru", since: "sabaody", until: null },
      { char: "fujitora", since: "dressrosa", until: null, note: "世界徴兵で就任" },
      { char: "ryokugyu", since: "wano", until: null, note: "世界徴兵で就任" }
    ] },
  { id: "pos-fleet-admiral", name: "海軍元帥", desc: "海軍の最高位。大将たちを束ね、海軍全体の方針を決める。", seats: 1,
    holders: [
      { char: "sengoku", since: null, until: "post-war", note: "頂上戦争の後に引退し大目付へ" },
      { char: "akainu", since: "post-war", until: null }
    ] },
  { id: "pos-elders", name: "五老星", desc: "世界政府の最高権力者とされる5人の老人。実際にはその上にイムが君臨している。", seats: 5,
    holders: [
      { char: "saturn", since: null, until: "egghead", note: "エッグヘッドで任務に失敗し、イムに処断された" },
      { char: "mars", since: null, until: null },
      { char: "warcury", since: null, until: null },
      { char: "nusjuro", since: null, until: null },
      { char: "ju-peter", since: null, until: null },
      { char: "garling", since: "egghead", until: null, note: "サターン聖の後任" }
    ] }
];
