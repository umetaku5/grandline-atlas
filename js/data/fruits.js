// 悪魔の実図鑑。holders は能力者の履歴(継承順)。
window.OP = window.OP || {};
OP.fruits = [
  // ===== 麦わらの一味 =====
  { id: "hito-hito-nika", name: "ヒトヒトの実 幻獣種 モデル“ニカ”", type: "動物系", subtype: "幻獣種",
    desc: "太陽の神ニカに変身する動物系幻獣種の実。世界政府は800年にわたってこの実を追い、「ゴムゴムの実」という名で超人系に見せかけて正体を隠してきた。体はゴムの性質を持ち、覚醒すると周囲の物まで想像どおりにゴムのように変えられる。政府の輸送船から奪ったのはシャンクスで、それを幼いルフィが誤って食べた。",
    holders: [
      { char: "luffy", since: null, until: null, note: "幼少期にフーシャ村で食べた。ワノ国で覚醒しギア5に至る" }
    ] },
  { id: "hito-hito-fruit", name: "ヒトヒトの実", type: "動物系", subtype: null,
    desc: "動物が食べると人間の知能と姿を得る動物系の実。チョッパーはこの実で人と同じように話し、考えるトナカイになった。ランブルボールで変形の幅を広げ、その後は薬なしでも複数の形態を使いこなす。",
    holders: [
      { char: "chopper", since: null, until: null, note: "トナカイが食べたため人獣型が「人寄り」になる" }
    ] },
  { id: "hana-hana-fruit", name: "ハナハナの実", type: "超人系", subtype: null,
    desc: "自分の体の一部を周囲のあらゆる場所に花のように咲かせる実。腕を生やして相手を締め上げたり、目や耳を咲かせて偵察したりと応用が広い。新世界では巨大な分身「悪魔（デモニオ）」の姿も使うようになった。",
    holders: [
      { char: "robin", since: null, until: null, note: "8歳のときに食べ、オハラで「悪魔の子」と呼ばれる一因になった" }
    ] },
  { id: "yomi-yomi-fruit", name: "ヨミヨミの実", type: "超人系", subtype: null,
    desc: "一度だけ死から蘇ることができる実。ブルックは魂が戻るまで一年かかり、肉体が白骨化していたため骸骨の姿で復活した。のちに魂を体から抜け出させたり、冥界の冷気を剣にまとわせたりと能力を広げている。",
    holders: [
      { char: "brook", since: null, until: null, note: "死後、魂が肉体を探してさまよい、骸骨として復活" }
    ] },

  // ===== ルフィの兄弟・家族周辺 =====
  { id: "mera-mera-fruit", name: "メラメラの実", type: "自然系", subtype: null,
    desc: "全身を炎に変え、炎を自在に生み出す自然系の実。「火拳」の異名の由来となった。持ち主の死後、ドレスローザのコロシアムの優勝賞品として現れ、兄弟分のサボが受け継いだ。",
    holders: [
      { char: "ace", since: null, until: "marineford", note: "頂上戦争でルフィをかばい死亡" },
      { char: "sabo", since: "dressrosa", until: null, note: "コロシアムの景品を食べて継承" }
    ] },

  // ===== 東の海 =====
  { id: "bara-bara-fruit", name: "バラバラの実", type: "超人系", subtype: null,
    desc: "体をいくつものパーツに分けて自由に飛ばせる実。斬撃がまったく効かないため、剣士にとっては天敵となる。足だけは地面から浮かせられないという制約がある。",
    holders: [
      { char: "buggy", since: null, until: null, note: "ロジャー海賊団の見習い時代に、シャンクスとのいさかいの中で飲み込んだ" }
    ] },
  { id: "sube-sube-fruit", name: "スベスベの実", type: "超人系", subtype: null,
    desc: "肌がつるつるになり、あらゆる攻撃を滑らせて受け流せる実。アルビダはこの実で体型まで変わり、見違えるような美貌を手に入れた。",
    holders: [
      { char: "alvida", since: "loguetown", until: null, note: "ルフィに敗れた後に食べ、姿が一変して再登場" }
    ] },
  { id: "moku-moku-fruit", name: "モクモクの実", type: "自然系", subtype: null,
    desc: "体を煙に変え、煙で相手を捕らえたり乗り物にしたりできる自然系の実。ローグタウンでは煙でルフィを押さえつけ、自然系の厄介さを読者に初めて見せた。",
    holders: [
      { char: "smoker", since: null, until: null, note: null }
    ] },

  // ===== アラバスタ・バロックワークス =====
  { id: "suna-suna-fruit", name: "スナスナの実", type: "自然系", subtype: null,
    desc: "体を砂に変え、触れた物から水分を奪って干からびさせる自然系の実。アラバスタでは砂嵐を起こして国を乾かそうとしたが、水で砂が固まる弱点をルフィに突かれた。",
    holders: [
      { char: "crocodile", since: null, until: null, note: null }
    ] },
  { id: "mane-mane-fruit", name: "マネマネの実", type: "超人系", subtype: null,
    desc: "右手で顔に触れた相手の顔と体格をそっくり真似できる実。外見だけでなく声までも写し取れるため、変装や潜入に向く。ワノ国の過去編では、黒炭ひぐらしがかつて同じ能力を使っていたことが描かれた。",
    holders: [
      { name: "黒炭ひぐらし", since: null, until: "wano", note: "光月おでんの時代に暗躍。おでんの過去編で死亡が描かれた" },
      { char: "bon-clay", since: null, until: null, note: "Mr.2として登場時から使用" }
    ] },
  { id: "supa-supa-fruit", name: "スパスパの実", type: "超人系", subtype: null,
    desc: "全身を刃物に変えられる実。腕や足のどこからでも鋭い刃を生やし、鋼鉄並みの硬さで攻撃を受け止める。",
    holders: [
      { name: "ダズ・ボーネス（Mr.1）", since: "alabasta", until: null, note: null }
    ] },
  { id: "doru-doru-fruit", name: "ドルドルの実", type: "超人系", subtype: null,
    desc: "体から蝋を出し、鉄のように固めて武器や拘束具を作る実。リトルガーデンでは巨人たちや麦わらの一味を蝋人形にしようとした。火に弱い点が弱点。",
    holders: [
      { name: "ギャルディーノ（Mr.3）", since: "little-garden", until: null, note: null }
    ] },
  { id: "bomu-bomu-fruit", name: "ボムボムの実", type: "超人系", subtype: null,
    desc: "体のどこでも爆発させられる「全身爆弾人間」になる実。鼻くそや息まで爆弾に変えるが、本人は爆発でダメージを受けない。",
    holders: [
      { name: "Mr.5", since: "whisky-peak", until: null, note: null }
    ] },
  { id: "kilo-kilo-fruit", name: "キロキロの実", type: "超人系", subtype: null,
    desc: "体重を1キロから1万キロまで自在に変えられる実。軽くなって空に舞い上がり、重くなって相手を押しつぶす戦い方をする。",
    holders: [
      { name: "ミス・バレンタイン", since: "whisky-peak", until: null, note: null }
    ] },
  { id: "toge-toge-fruit", name: "トゲトゲの実", type: "超人系", subtype: null,
    desc: "体のあらゆる部分から鋭いトゲを生やせる実。髪や指先を針のように伸ばして相手を突き刺す。",
    holders: [
      { name: "ミス・ダブルフィンガー", since: "alabasta", until: null, note: null }
    ] },
  { id: "mogu-mogu-fruit", name: "モグモグの実", type: "動物系", subtype: null,
    desc: "モグラに変身する動物系の実。地中を高速で掘り進み、相手の足元から奇襲をかける。",
    holders: [
      { name: "ミス・メリークリスマス", since: "alabasta", until: null, note: null }
    ] },
  { id: "inu-inu-dachshund-fruit", name: "イヌイヌの実 モデル“ダックスフント”", type: "動物系", subtype: null,
    desc: "銃にこの実を食べさせた珍しい例で、銃でありながら犬の性質を持つ「犬銃」が生まれた。くしゃみのように爆弾を撃ち出す。",
    holders: [
      { name: "ラッスー", since: "alabasta", until: null, note: "Mr.4の相棒。銃が実を食べた" }
    ] },
  { id: "tori-tori-falcon-fruit", name: "トリトリの実 モデル“隼”", type: "動物系", subtype: null,
    desc: "隼に変身して空を飛べる動物系の実。アラバスタ護衛隊の守護神ペルは、この力で爆弾を抱えて空高く運び、国を救った。",
    holders: [
      { char: "pell", since: null, until: null, note: null }
    ] },
  { id: "inu-inu-jackal-fruit", name: "イヌイヌの実 モデル“ジャッカル”", type: "動物系", subtype: null,
    desc: "ジャッカルに変身する動物系の実。アラバスタ護衛隊のチャカが持ち、強靭な牙と剣術を組み合わせて戦う。",
    holders: [
      { char: "chaka", since: null, until: null, note: null }
    ] },

  // ===== ドラム・ジャヤ・空島 =====
  { id: "baku-baku-fruit", name: "バクバクの実", type: "超人系", subtype: null,
    desc: "どんな物でも食べてしまい、食べた物を体に取り込んで自分を武器や乗り物に変える実。ワポルは大砲を食べて体を大砲に変えるなど、悪食をそのまま戦闘に使った。",
    holders: [
      { char: "wapol", since: null, until: null, note: null }
    ] },
  { id: "ushi-ushi-bison-fruit", name: "ウシウシの実 モデル“野牛”", type: "動物系", subtype: null,
    desc: "野牛（バイソン）に変身する動物系の実。ドルトンはこの力と突進力で、暴君ワポルに抵抗しドラム王国の人々を守った。",
    holders: [
      { char: "dalton", since: null, until: null, note: null }
    ] },
  { id: "bane-bane-fruit", name: "バネバネの実", type: "超人系", subtype: null,
    desc: "足や腕をバネに変え、跳ね返る力で高速移動や強烈な打撃を繰り出す実。ジャヤで夢を笑ったベラミーは、ドレスローザでルフィとの再戦に挑んだ。",
    holders: [
      { char: "bellamy", since: null, until: null, note: null }
    ] },
  { id: "goro-goro-fruit", name: "ゴロゴロの実", type: "自然系", subtype: null,
    desc: "雷そのものになる自然系の実で、電気を操って高速で移動し、巨大な雷を落とす。空島ではエネルが見聞色の一種「心網（マントラ）」と組み合わせて神を名乗ったが、絶縁体であるゴムの体を持つルフィには通じなかった。",
    holders: [
      { char: "enel", since: null, until: null, note: "空島編のあと、月へと旅立った" }
    ] },
  { id: "uma-uma-pegasus-fruit", name: "ウマウマの実 モデル“ペガサス”", type: "動物系", subtype: "幻獣種",
    desc: "鳥が食べたことで、翼を持つ馬の姿にもなれるようになった幻獣種の実。空の騎士ガン・フォールの相棒ピエールが持ち、主人を乗せて空を駆ける。",
    holders: [
      { name: "ピエール", since: "skypiea", until: null, note: "ガン・フォールの相棒の鳥。「トリなのにウマ」" }
    ] },

  // ===== ロングリングロングランド =====
  { id: "noro-noro-fruit", name: "ノロノロの実", type: "超人系", subtype: null,
    desc: "光線を当てた物の動きを30秒間だけ極端に遅くする実。デービーバックファイトでフォクシーが反則まがいに使ったが、鏡で跳ね返されると自分が遅くなる弱点がある。",
    holders: [
      { name: "フォクシー", since: "long-ring", until: null, note: null }
    ] },
  { id: "hie-hie-fruit", name: "ヒエヒエの実", type: "自然系", subtype: null,
    desc: "体を氷に変え、海さえ一瞬で凍らせる自然系の実。パンクハザードでは赤犬と十日間におよぶ決闘を行い、島の気候を炎と氷に二分したとされる。",
    holders: [
      { char: "aokiji", since: null, until: null, note: "海軍を去った後は黒ひげ海賊団に身を置く" }
    ] },

  // ===== ウォーターセブン・エニエス・ロビー =====
  { id: "neko-neko-leopard-fruit", name: "ネコネコの実 モデル“豹”", type: "動物系", subtype: null,
    desc: "豹に変身する動物系の実で、肉食獣系の動物系の中でも特に凶暴とされる。ルッチは六式と組み合わせて圧倒的な戦闘力を見せ、後に覚醒も果たした。",
    holders: [
      { char: "lucci", since: null, until: null, note: "エッグヘッドでは覚醒した姿を見せる" }
    ] },
  { id: "ushi-ushi-giraffe-fruit", name: "ウシウシの実 モデル“麒麟”", type: "動物系", subtype: null,
    desc: "キリンに変身する動物系の実。長い首を使った剣技や蹴りが持ち味で、見た目のおかしさに反して強烈な威力を持つ。",
    holders: [
      { char: "kaku", since: null, until: null, note: "エニエス・ロビーで能力を得たばかりの状態で登場" }
    ] },
  { id: "inu-inu-wolf-fruit", name: "イヌイヌの実 モデル“狼”", type: "動物系", subtype: null,
    desc: "狼に変身する動物系の実。ジャブラは六式と狼の牙を組み合わせた拳法で戦った。",
    holders: [
      { char: "jabra", since: null, until: null, note: null }
    ] },
  { id: "awa-awa-fruit", name: "アワアワの実", type: "超人系", subtype: null,
    desc: "体から石鹸の泡を出す実。泡に触れた相手は力が抜けるほどつるつるに「洗い落とされ」てしまう。",
    holders: [
      { char: "kalifa", since: null, until: null, note: null }
    ] },
  { id: "doa-doa-fruit", name: "ドアドアの実", type: "超人系", subtype: null,
    desc: "壁や床、さらには空気にまで扉を作り出して通り抜けられる実。逃走や潜入、奇襲に使える便利な能力。",
    holders: [
      { char: "blueno", since: null, until: null, note: null }
    ] },
  { id: "zou-zou-fruit", name: "ゾウゾウの実", type: "動物系", subtype: null,
    desc: "剣にこの実を食べさせ、象の姿にもなる「象剣」を生み出した例。スパンダムの愛剣ファンクフリードが持ち、象になったり剣に戻ったりする。",
    holders: [
      { name: "ファンクフリード", since: "enies-lobby", until: null, note: "スパンダムの剣が実を食べた" }
    ] },

  // ===== スリラーバーク =====
  { id: "kage-kage-fruit", name: "カゲカゲの実", type: "超人系", subtype: null,
    desc: "影を自在に操る実で、他人の影を切り取って死体に入れ、ゾンビ兵として動かせる。影を奪われた者は日の光を浴びると消滅してしまう。",
    holders: [
      { char: "moria", since: null, until: null, note: null }
    ] },
  { id: "horo-horo-fruit", name: "ホロホロの実", type: "超人系", subtype: null,
    desc: "霊体（ゴースト）を生み出して操る実。ネガティブ・ホロウに触れた相手は気力を失い、ひどく落ち込んでしまう。",
    holders: [
      { char: "perona", since: null, until: null, note: null }
    ] },
  { id: "suke-suke-fruit", name: "スケスケの実", type: "超人系", subtype: null,
    desc: "自分や触れた物を透明にする実。スリラーバークではアブサロムが覗きや奇襲に使った。後にアブサロムは黒ひげ海賊団に殺され、能力はシリュウの手に渡った。",
    holders: [
      { char: "absalom", since: null, until: "wano", note: "黒ひげ海賊団に殺害され、能力を奪われたことが判明" },
      { char: "shiryu", since: "wano", until: null, note: "黒ひげの能力奪取の方法で手に入れたとみられる" }
    ] },

  // ===== シャボンディ・最悪の世代 =====
  { id: "nikyu-nikyu-fruit", name: "ニキュニキュの実", type: "超人系", subtype: null,
    desc: "手の肉球であらゆる物を弾き飛ばす実。空気や人だけでなく、痛みや疲労、記憶といった形のないものまで弾き出せる。シャボンディ諸島では麦わらの一味を世界各地へ飛ばし、仲間を逃がした。",
    holders: [
      { char: "kuma", since: null, until: null, note: "改造によって人間兵器にされた後も、娘ボニーを思う記憶が残された" }
    ] },
  { id: "ope-ope-fruit", name: "オペオペの実", type: "超人系", subtype: null,
    desc: "「ROOM」と呼ぶ空間を作り、その中の物を切り離したり入れ替えたりできる実。究極の技「不老手術」は他人に永遠の命を与えるが、術者自身は命を落とす。病に冒されたローを救うため、コラソン（ロシナンテ）が取引の場からこの実を奪い、ローに食べさせた。",
    holders: [
      { char: "law", since: null, until: null, note: "13年前、ミニオン島でコラソンが奪った実を食べ、珀鉛病を治した" }
    ] },
  { id: "jiki-jiki-fruit", name: "ジキジキの実", type: "超人系", subtype: null,
    desc: "磁力を操り、周囲の金属を引き寄せて巨大な腕や武器を形作る実。ワノ国では「反発」を応用した大技でビッグ・マムを打ち破った。",
    holders: [
      { char: "kid", since: null, until: null, note: null }
    ] },
  { id: "wara-wara-fruit", name: "ワラワラの実", type: "超人系", subtype: null,
    desc: "体をわらに変え、わら人形を使って受けたダメージを他人に肩代わりさせる実。体内に生贄の命をストックしておけば、致命傷すら他人に押しつけられる。",
    holders: [
      { char: "hawkins", since: null, until: null, note: null }
    ] },
  { id: "ryu-ryu-allosaurus-fruit", name: "リュウリュウの実 古代種 モデル“アロサウルス”", type: "動物系", subtype: "古代種",
    desc: "肉食恐竜アロサウルスに変身する古代種の実。強靭な顎と体力を持ち、海軍の極秘部隊SWORDの隊長でもあるドレークの主力となった。",
    holders: [
      { char: "drake", since: null, until: null, note: null }
    ] },
  { id: "oto-oto-fruit", name: "オトオトの実", type: "超人系", subtype: null,
    desc: "体を楽器にして音を出し、その音を攻撃に変える実。音を聞いた相手を斬りつけたり、爆発を起こしたりできる。",
    holders: [
      { char: "apoo", since: null, until: null, note: null }
    ] },
  { id: "shiro-shiro-fruit", name: "シロシロの実", type: "超人系", subtype: null,
    desc: "自分の体を城（要塞）にし、中に部下や武器を収容できる実。体を巨大化させて動く要塞として戦うこともできる。",
    holders: [
      { char: "bege", since: null, until: null, note: null }
    ] },
  { id: "toshi-toshi-fruit", name: "トシトシの実", type: "超人系", subtype: null,
    desc: "自分や他人の年齢を自在に変えられる実。さらに自分が思い描いた「未来」の姿になることもでき、エッグヘッドではニカの姿を想像して戦った。",
    holders: [
      { char: "bonney", since: null, until: null, note: null }
    ] },
  { id: "pika-pika-fruit", name: "ピカピカの実", type: "自然系", subtype: null,
    desc: "体を光に変える自然系の実。光の速さで移動・攻撃でき、指先からレーザーを放つ。エッグヘッド事件では旧知のベガパンクを討つ任務を負った。",
    holders: [
      { char: "kizaru", since: null, until: null, note: null }
    ] },
  { id: "numa-numa-fruit", name: "ヌマヌマの実", type: "自然系", subtype: null,
    desc: "体を底なしの沼に変え、人や物を無制限に飲み込んでしまう自然系の実。飲み込んだ武器や財宝を体内から取り出して使うこともできる。",
    holders: [
      { name: "カリブー", since: "return-sabaody", until: null, note: null }
    ] },

  // ===== 女ヶ島・インペルダウン =====
  { id: "mero-mero-fruit", name: "メロメロの実", type: "超人系", subtype: null,
    desc: "見とれて邪な心を抱いた者を石に変える実で、武器を石化させることもできる。ルフィにはまったく下心がなかったため効かなかった。",
    holders: [
      { char: "hancock", since: null, until: null, note: null }
    ] },
  { id: "horu-horu-fruit", name: "ホルホルの実", type: "超人系", subtype: null,
    desc: "体からホルモンを注射して、相手の性別や体温、気分まで変えてしまう実。インペルダウンでは瀕死のルフィの生命力を引き出して命を救った。",
    holders: [
      { char: "ivankov", since: null, until: null, note: null }
    ] },
  { id: "choki-choki-fruit", name: "チョキチョキの実", type: "超人系", subtype: null,
    desc: "手をハサミに変え、紙のように何でも切れるようにする実。床や壁を切り抜いて道を作るなど、脱獄劇で活躍した。",
    holders: [
      { char: "inazuma", since: null, until: null, note: null }
    ] },
  { id: "doku-doku-fruit", name: "ドクドクの実", type: "超人系", subtype: null,
    desc: "体からあらゆる毒を生み出す実。猛毒の怪物「毒の巨兵」を作り出し、インペルダウンでルフィを瀕死に追い込んだ。",
    holders: [
      { char: "magellan", since: null, until: null, note: null }
    ] },
  { id: "fuwa-fuwa-fruit", name: "フワフワの実", type: "超人系", subtype: null,
    desc: "自分の体以外で、一度触れた物を宙に浮かせて自在に操る実。シキは島ごと空に浮かべて、自らの空中艦隊の拠点にした。",
    holders: [
      { char: "shiki", since: null, until: null, note: null }
    ] },

  // ===== 黒ひげ海賊団 =====
  { id: "yami-yami-fruit", name: "ヤミヤミの実", type: "自然系", subtype: null,
    desc: "闇人間になる自然系の実。闇はあらゆる物を引きずり込み、触れた相手の悪魔の実の能力を封じる。自然系なのに攻撃を受け流せず痛みも大きく受ける特異な実で、黒ひげはこれを手に入れるため白ひげ海賊団で仲間殺しの罪を犯した。",
    holders: [
      { char: "blackbeard", since: null, until: null, note: "実を見つけた仲間サッチを殺して奪った" }
    ] },
  { id: "gura-gura-fruit", name: "グラグラの実", type: "超人系", subtype: null,
    desc: "空気や大地に振動を起こし、地震や津波を生む「世界を滅ぼす力」と恐れられた実。頂上戦争で白ひげが死んだ直後、黒ひげが謎の方法でこの能力を奪い、二つの悪魔の実を持つ唯一の人物となった。",
    holders: [
      { char: "whitebeard", since: null, until: "marineford", note: "頂上戦争で死亡" },
      { char: "blackbeard", since: "marineford", until: null, note: "白ひげの遺体から謎の方法で能力を奪った" }
    ] },
  { id: "wapu-wapu-fruit", name: "ワプワプの実", type: "超人系", subtype: null,
    desc: "自分や触れた者を瞬間移動させる「ワープ人間」になる実。黒ひげ海賊団の移動手段として重宝されている。",
    holders: [
      { char: "van-augur", since: null, until: null, note: null }
    ] },
  { id: "shiku-shiku-fruit", name: "シクシクの実", type: "超人系", subtype: null,
    desc: "触れた相手を病気にしてしまう実。持ち主のドクQ自身も病弱で、いつも咳き込んでいる。",
    holders: [
      { char: "doc-q", since: null, until: null, note: null }
    ] },
  { id: "inu-inu-kyubi-fruit", name: "イヌイヌの実 幻獣種 モデル“九尾の狐”", type: "動物系", subtype: "幻獣種",
    desc: "九尾の狐に変身する幻獣種の実で、他人の姿に化けることもできる。インペルダウン最下層から脱獄した「三日月狩りのカタリーナ・デボン」が使う。",
    holders: [
      { char: "devon", since: null, until: null, note: null }
    ] },
  { id: "deka-deka-fruit", name: "デカデカの実", type: "超人系", subtype: null,
    desc: "体をさらに巨大化させる実。もともと巨人族より大きいサンファン・ウルフは、これによって世界最大の人間になった。",
    holders: [
      { char: "wolf", since: null, until: null, note: null }
    ] },
  { id: "shima-shima-fruit", name: "シマシマの実", type: "超人系", subtype: null,
    desc: "島と一体化し、地形そのものを自分の体のように動かす実。島ごと敵を押しつぶすなど、規模の大きい攻撃ができる。",
    holders: [
      { char: "pizarro", since: "egghead", until: null, note: "能力名は後に判明" }
    ] },
  { id: "gabu-gabu-fruit", name: "ガブガブの実", type: "超人系", subtype: null,
    desc: "大量の酒を飲み、その酒を火の付いた液体として吐き出すなどして攻撃する実。大酒飲みのヴァスコ・ショットにふさわしい能力。",
    holders: [
      { char: "shot", since: null, until: null, note: null }
    ] },

  // ===== 白ひげ海賊団・頂上戦争 =====
  { id: "tori-tori-phoenix", name: "トリトリの実 幻獣種 モデル“不死鳥”", type: "動物系", subtype: "幻獣種",
    desc: "青い炎をまとう不死鳥に変身する幻獣種の実。炎で傷を再生させる力があり、他人の治療にも応用できる。",
    holders: [
      { char: "marco", since: null, until: null, note: null }
    ] },
  { id: "kira-kira-fruit", name: "キラキラの実", type: "超人系", subtype: null,
    desc: "体をダイヤモンドに変える実。世界一硬い物質の体で攻撃を防ぎ、そのまま殴りつける。",
    holders: [
      { char: "jozu", since: null, until: null, note: null }
    ] },
  { id: "hito-hito-daibutsu-fruit", name: "ヒトヒトの実 幻獣種 モデル“大仏”", type: "動物系", subtype: "幻獣種",
    desc: "黄金に輝く巨大な大仏に変身する幻獣種の実。手のひらから強烈な衝撃波を放つ。「仏のセンゴク」の異名の由来でもある。",
    holders: [
      { char: "sengoku", since: null, until: null, note: null }
    ] },
  { id: "magu-magu-fruit", name: "マグマグの実", type: "自然系", subtype: null,
    desc: "体をマグマに変える自然系の実で、炎さえ焼き尽くす高熱を持つ。頂上戦争ではエースの命を奪い、ジンベエやルフィにも深い傷を負わせた。",
    holders: [
      { char: "akainu", since: null, until: null, note: null }
    ] },
  { id: "woshu-woshu-fruit", name: "ウォシュウォシュの実", type: "超人系", subtype: null,
    desc: "人や物を洗濯物のように洗って絞り、干してしまう実。洗われた相手は心まで「洗われ」、悪意を失ったり身動きが取れなくなったりする。",
    holders: [
      { char: "tsuru", since: null, until: null, note: "能力は後に判明" }
    ] },
  { id: "ori-ori-fruit", name: "オリオリの実", type: "超人系", subtype: null,
    desc: "体から鉄の輪や檻を出し、相手を拘束する実。海軍のヒナが犯罪者の捕縛に使う。",
    holders: [
      { name: "ヒナ", since: "alabasta", until: null, note: null }
    ] },

  // ===== 魚人島 =====
  { id: "mato-mato-fruit", name: "マトマトの実", type: "超人系", subtype: null,
    desc: "触れた物を「的」にし、投げた物を必ずその的に当てる実。ヴァンダー・デッケン九世はしらほしへの執着から、この力で狙い続けた。",
    holders: [
      { name: "ヴァンダー・デッケン九世", since: "fishman-island", until: null, note: null }
    ] },

  // ===== パンクハザード =====
  { id: "gasu-gasu-fruit", name: "ガスガスの実", type: "自然系", subtype: null,
    desc: "体を気体に変え、毒ガスを生み出したり周囲の酸素を奪ったりできる自然系の実。シーザーは化学兵器の研究とこの力を組み合わせた。",
    holders: [
      { char: "caesar", since: null, until: null, note: null }
    ] },
  { id: "yuki-yuki-fruit", name: "ユキユキの実", type: "自然系", subtype: null,
    desc: "体を雪に変え、吹雪や雪の兵士を生み出す自然系の実。パンクハザードの雪山を拠点に、モネがシーザーの護衛を務めた。",
    holders: [
      { char: "monet", since: null, until: "punk-hazard", note: "研究所の混乱の中で心臓を刺され死亡" }
    ] },
  { id: "ame-ame-fruit", name: "アメアメの実", type: "自然系", subtype: null,
    desc: "体を水飴に変える自然系の実。シーザーが実験体のスライム「スマイリー」に食べさせて巨大な毒ガスの怪物にした。スマイリーが死ぬと近くのリンゴがこの実に変わり、能力が再び実として生まれる様子が初めて描かれた。",
    holders: [
      { name: "スマイリー", since: "punk-hazard", until: "punk-hazard", note: "シーザーの実験で死亡し、実が再生した" }
    ] },

  // ===== ドレスローザ・ドンキホーテファミリー =====
  { id: "ito-ito-fruit", name: "イトイトの実", type: "超人系", subtype: null,
    desc: "糸を自在に生み出し操る実で、人を操り人形にしたり、糸で分身を作ったりできる。覚醒すると周囲の地面や建物まで糸に変えられ、国全体を閉じ込める「鳥カゴ」を作り出した。",
    holders: [
      { char: "doflamingo", since: null, until: null, note: "ドレスローザで覚醒した能力を披露" }
    ] },
  { id: "nagi-nagi-fruit", name: "ナギナギの実", type: "超人系", subtype: null,
    desc: "周囲の音を消す「無音」の空間を作る実。ドンキホーテ・ロシナンテ（コラソン）はこの力で物音を立てずに動き、オペオペの実を奪ってローを救った。",
    holders: [
      { char: "corazon", since: null, until: "dressrosa", note: "13年前、ドフラミンゴに撃たれて死亡（過去編で描かれた）" }
    ] },
  { id: "beta-beta-fruit", name: "ベタベタの実", type: "超人系", subtype: null,
    desc: "体からねばねばした粘液を出す実。粘液は燃えやすく、火をつけて攻撃にも使う。",
    holders: [
      { char: "trebol", since: null, until: null, note: null }
    ] },
  { id: "hobi-hobi-fruit", name: "ホビホビの実", type: "超人系", subtype: null,
    desc: "触れた相手をおもちゃに変え、契約で服従させる実。おもちゃにされた者は人々の記憶からも消えてしまう。ドレスローザの闇を支える能力だった。",
    holders: [
      { char: "sugar", since: null, until: null, note: "ウソップの顔に驚いて気絶し、呪いが解けた" }
    ] },
  { id: "giro-giro-fruit", name: "ギロギロの実", type: "超人系", subtype: null,
    desc: "遠くの景色や人の心の中まで見通す「透視」の実。ヴィオラは国中を見渡し、ルフィたちに情報を伝えた。",
    holders: [
      { char: "viola", since: null, until: null, note: null }
    ] },
  { id: "bari-bari-fruit", name: "バリバリの実", type: "超人系", subtype: null,
    desc: "どんな攻撃も通さないバリアを張る実。バリアの形を変えて盾や足場、攻撃にも使える。",
    holders: [
      { char: "bartolomeo", since: null, until: null, note: null }
    ] },
  { id: "zushi-zushi-fruit", name: "ズシズシの実", type: "超人系", subtype: null,
    desc: "重力を操る実で、相手を地面に押しつぶしたり、空から隕石を降らせたりする。盲目の藤虎は、この力で自分自身も宙に浮かせる。",
    holders: [
      { char: "fujitora", since: null, until: null, note: null }
    ] },
  { id: "ishi-ishi-fruit", name: "イシイシの実", type: "超人系", subtype: null,
    desc: "石と同化し、石でできた物を自在に動かす実。ピーカはドレスローザの街全体と一体化し、巨大な石像として戦った。",
    holders: [
      { name: "ピーカ", since: "dressrosa", until: null, note: null }
    ] },
  { id: "hira-hira-fruit", name: "ヒラヒラの実", type: "超人系", subtype: null,
    desc: "硬い物を旗のようにひらひらとはためかせる実。鋼鉄の剣を自在にしならせて攻撃する。",
    holders: [
      { name: "ディアマンテ", since: "dressrosa", until: null, note: null }
    ] },
  { id: "sui-sui-fruit", name: "スイスイの実", type: "超人系", subtype: null,
    desc: "地面や壁の中を水のように泳げる実。セニョール・ピンクは床を泳いで奇襲をかける。",
    holders: [
      { name: "セニョール・ピンク", since: "dressrosa", until: null, note: null }
    ] },
  { id: "pamu-pamu-fruit", name: "パムパムの実", type: "超人系", subtype: null,
    desc: "自分の体や触れた物を膨らませて破裂させる実。ドンキホーテファミリーのグラディウスが使った。",
    holders: [
      { name: "グラディウス", since: "dressrosa", until: null, note: null }
    ] },
  { id: "buki-buki-fruit", name: "ブキブキの実", type: "超人系", subtype: null,
    desc: "体のあらゆる部分を刃物や銃などの武器に変える実。ベビー5は「必要とされたい」一心でこの力を使う。",
    holders: [
      { name: "ベビー5", since: "dressrosa", until: null, note: null }
    ] },
  { id: "chiyu-chiyu-fruit", name: "チユチユの実", type: "超人系", subtype: null,
    desc: "涙を使って傷を癒やす治癒の実。小人族の王女マンシェリーが持ち、ドフラミンゴ一味に捕らわれ利用されていた。",
    holders: [
      { name: "マンシェリー", since: "dressrosa", until: null, note: null }
    ] },

  // ===== ゾウ・ワノ国の侍 =====
  { id: "fuku-fuku-fruit", name: "フクフクの実", type: "超人系", subtype: null,
    desc: "葉っぱや草などを材料に、どんな服でも作り出して着せられる実。錦えもんはこれで仲間の変装を一瞬で用意した。",
    holders: [
      { char: "kinemon", since: null, until: null, note: null }
    ] },
  { id: "maki-maki-fruit", name: "マキマキの実", type: "超人系", subtype: null,
    desc: "物を巻物の中に巻き取って保管し、自在に取り出せる実。忍者の雷ぞうは、敵の攻撃さえ巻物に吸い込んで跳ね返す。",
    holders: [
      { char: "raizo", since: null, until: null, note: null }
    ] },
  { id: "fude-fude-fruit", name: "フデフデの実", type: "超人系", subtype: null,
    desc: "筆で描いた絵を実体化させる実。カン十郎は赤鞘九人男の一員を装いながら、この力でオロチ側の密偵として動いた。",
    holders: [
      { char: "kanjuro", since: null, until: "wano", note: "鬼ヶ島の戦いで死亡" }
    ] },
  { id: "toki-toki-fruit", name: "トキトキの実", type: "超人系", subtype: null,
    desc: "自分や他人を未来へ時間跳躍させる実。過去に戻ることはできない。光月トキは息子モモの助と家臣たちを20年後のワノ国へ送り出した。",
    holders: [
      { char: "toki", since: null, until: "wano", note: "20年前、おでんの死後に命を落とした（過去編）" }
    ] },
  { id: "kibi-kibi-fruit", name: "キビキビの実", type: "超人系", subtype: null,
    desc: "体からきびだんごを作り、それを食べた動物を手なずける実。ワノ国では、お玉がSMILEを食べた敵の動物系能力者まで味方にしてしまった。",
    holders: [
      { char: "otama", since: null, until: null, note: null }
    ] },
  { id: "hebi-hebi-yamata-fruit", name: "ヘビヘビの実 幻獣種 モデル“八岐大蛇”", type: "動物系", subtype: "幻獣種",
    desc: "八つの頭を持つ大蛇に変身する幻獣種の実。首を一本ずつ失っても生き延びられるほどしぶとい。将軍オロチはこの力で自らの恐ろしさを誇示した。",
    holders: [
      { char: "orochi", since: null, until: "wano", note: "ワノ国決戦の終盤で死亡" }
    ] },
  { id: "artificial-seiryu-fruit", name: "人工悪魔の実（ウオウオの実 モデル“青龍”の模造）", type: "動物系", subtype: "幻獣種",
    desc: "ベガパンクがカイドウの血統因子をもとに作った人工の悪魔の実。失敗作とされ、モモの助が変身できる龍は本家のカイドウより小さく色もピンクに近い。ワノ国の決戦でモモの助は成長した姿となり、鬼ヶ島を支え続けた。",
    holders: [
      { char: "momonosuke", since: null, until: null, note: "人工悪魔の実。パンクハザードで盗み食いした" }
    ] },

  // ===== ホールケーキアイランド・ビッグ・マム海賊団 =====
  { id: "soru-soru-fruit", name: "ソルソルの実", type: "超人系", subtype: null,
    desc: "人の魂（寿命）を抜き取り、物や動物に分け与えて意思を持たせる実。こうして生まれた存在は「ホーミーズ」と呼ばれ、ビッグ・マムは太陽のプロメテウスや雷雲のゼウスを従えた。",
    holders: [
      { char: "big-mom", since: null, until: null, note: "ワノ国で溶岩に落ち、生死不明" }
    ] },
  { id: "mochi-mochi-fruit", name: "モチモチの実", type: "超人系", subtype: null,
    desc: "体を餅に変え、餅を自在に生み出して操る実。自然系に似た性質を持つ「特殊な超人系」の代表例で、カタクリは覚醒して周囲を餅に変えることもできる。",
    holders: [
      { char: "katakuri", since: null, until: null, note: null }
    ] },
  { id: "shibo-shibo-fruit", name: "シボシボの実", type: "超人系", subtype: null,
    desc: "人や物から水分を絞り取る実。絞り取った液体で自分を巨大化させることもできる。",
    holders: [
      { char: "smoothie", since: null, until: null, note: null }
    ] },
  { id: "bisu-bisu-fruit", name: "ビスビスの実", type: "超人系", subtype: null,
    desc: "硬いビスケットを生み出す実。クラッカーはビスケットの兵士を大量に作り、本体はその中に隠れて戦った。",
    holders: [
      { char: "cracker", since: null, until: null, note: null }
    ] },
  { id: "pero-pero-fruit", name: "ペロペロの実", type: "超人系", subtype: null,
    desc: "体から飴を生み出し、固めて武器や拘束具にする実。飴で相手を閉じ込め、身動きを封じる。",
    holders: [
      { char: "perospero", since: null, until: null, note: null }
    ] },
  { id: "netsu-netsu-fruit", name: "ネツネツの実", type: "超人系", subtype: null,
    desc: "体を高熱にし、触れた物を熱し溶かす実。オーブンは海水すら沸騰させるほどの熱を放つ。",
    holders: [
      { char: "oven", since: null, until: null, note: null }
    ] },
  { id: "mira-mira-fruit", name: "ミラミラの実", type: "超人系", subtype: null,
    desc: "鏡の世界「ミラーワールド」を作り、鏡を通じて人や物を移動させる実。ビッグ・マム海賊団の連絡や移動の要となっていた。",
    holders: [
      { name: "シャーロット・ブリュレ", since: "whole-cake", until: null, note: null }
    ] },
  { id: "buku-buku-fruit", name: "ブクブクの実", type: "超人系", subtype: null,
    desc: "本の中に世界を作り、人を閉じ込める実。閉じ込められた者は本の世界から抜け出せない。",
    holders: [
      { name: "シャーロット・モンドール", since: "whole-cake", until: null, note: null }
    ] },
  { id: "hoya-hoya-fruit", name: "ホヤホヤの実", type: "超人系", subtype: null,
    desc: "体から魔人を呼び出して戦わせる実。シャーロット・ダイフクは腹をこすって魔人を出す。",
    holders: [
      { name: "シャーロット・ダイフク", since: "whole-cake", until: null, note: null }
    ] },
  { id: "kuri-kuri-fruit", name: "クリクリの実", type: "超人系", subtype: null,
    desc: "体から生クリームを出して操る実。高温のクリームで相手を焼いたり、守りに使ったりする。",
    holders: [
      { name: "シャーロット・オペラ", since: "whole-cake", until: null, note: null }
    ] },

  // ===== ワノ国・百獣海賊団 =====
  { id: "uo-uo-seiryu", name: "ウオウオの実 幻獣種 モデル“青龍”", type: "動物系", subtype: "幻獣種",
    desc: "巨大な青い龍に変身する幻獣種の実で、空を飛び、炎を吐き、雲を作り出す。龍の姿と人の姿を使い分け、人獣型では金棒と覇気で戦う。ベガパンクはカイドウの血統因子から、この実の人工版を生み出した。",
    holders: [
      { char: "kaido", since: null, until: null, note: "ワノ国でルフィに敗れ、生死不明" }
    ] },
  { id: "ryu-ryu-pteranodon-fruit", name: "リュウリュウの実 古代種 モデル“プテラノドン”", type: "動物系", subtype: "古代種",
    desc: "翼竜プテラノドンに変身する古代種の実。空を高速で飛び回り、ルナーリア族の頑丈さと炎と合わせて大看板キングの強さを支える。",
    holders: [
      { char: "king", since: null, until: null, note: null }
    ] },
  { id: "ryu-ryu-brachiosaurus-fruit", name: "リュウリュウの実 古代種 モデル“ブラキオサウルス”", type: "動物系", subtype: "古代種",
    desc: "長い首を持つ巨大な草食恐竜ブラキオサウルスに変身する古代種の実。クイーンは自らの体のサイボーグ改造と組み合わせて戦う。",
    holders: [
      { char: "queen", since: null, until: null, note: null }
    ] },
  { id: "zou-zou-mammoth-fruit", name: "ゾウゾウの実 古代種 モデル“マンモス”", type: "動物系", subtype: "古代種",
    desc: "マンモスに変身する古代種の実。ジャックはゾウの国を荒らし、その巨体で建物ごと押しつぶした。",
    holders: [
      { char: "jack", since: null, until: null, note: null }
    ] },
  { id: "neko-neko-sabertooth-fruit", name: "ネコネコの実 古代種 モデル“サーベルタイガー”", type: "動物系", subtype: "古代種",
    desc: "サーベルタイガーに変身する古代種の実。元CP9のフーズ・フーは六式の技と鋭い牙で戦う。",
    holders: [
      { char: "whos-who", since: null, until: null, note: null }
    ] },
  { id: "ryu-ryu-pachycephalosaurus-fruit", name: "リュウリュウの実 古代種 モデル“パキケファロサウルス”", type: "動物系", subtype: "古代種",
    desc: "石頭の恐竜パキケファロサウルスに変身する古代種の実。うるティは得意の頭突きをさらに強力にした。",
    holders: [
      { char: "ulti", since: null, until: null, note: null }
    ] },
  { id: "ryu-ryu-spinosaurus-fruit", name: "リュウリュウの実 古代種 モデル“スピノサウルス”", type: "動物系", subtype: "古代種",
    desc: "背びれを持つ肉食恐竜スピノサウルスに変身する古代種の実。ページワンはワノ国で麦わらの一味の前に立ちはだかった。",
    holders: [
      { char: "page-one", since: null, until: null, note: null }
    ] },
  { id: "ryu-ryu-triceratops-fruit", name: "リュウリュウの実 古代種 モデル“トリケラトプス”", type: "動物系", subtype: "古代種",
    desc: "トリケラトプスに変身する古代種の実。飛び六胞のササキはえりを回転させて飛ぶなど、独自の戦い方を見せた。",
    holders: [
      { name: "ササキ", since: "wano", until: null, note: null }
    ] },
  { id: "kumo-kumo-rosamygale-fruit", name: "クモクモの実 古代種 モデル“ロサミガレ・グラウボゲリ”", type: "動物系", subtype: "古代種",
    desc: "太古の巨大グモに変身する古代種の実。糸で獲物を絡め取り、炎の糸で焼くこともできる。飛び六胞のブラックマリアがロビンと戦った。",
    holders: [
      { name: "ブラックマリア", since: "wano", until: null, note: null }
    ] },
  { id: "inu-inu-okuchi-fruit", name: "イヌイヌの実 幻獣種 モデル“大口真神”", type: "動物系", subtype: "幻獣種",
    desc: "狼の神・大口真神に変身する幻獣種の実。冷気をまとい、守りの結界や治癒の力も持つ。カイドウの子ヤマトは、光月おでんを名乗りルフィたちと共に戦った。",
    holders: [
      { char: "yamato", since: null, until: null, note: "能力の正体は鬼ヶ島の戦いで明かされた" }
    ] },
  { id: "mori-mori-fruit", name: "モリモリの実", type: "自然系", subtype: null,
    desc: "体を森（植物）に変える自然系の実。根を張って大地の養分を吸い取り、長期間食事なしでも生きられる。緑牛は根で人々の生命力まで吸い上げた。",
    holders: [
      { char: "ryokugyu", since: null, until: null, note: null }
    ] },

  // ===== 世界会議・革命軍 =====
  { id: "oshi-oshi-fruit", name: "オシオシの実", type: "超人系", subtype: null,
    desc: "大地を粘土のように押し動かす実。巨人族の血を引くモーリーは地面を押して地下に道を作り、革命軍の移動を助けた。",
    holders: [
      { char: "morley", since: null, until: null, note: null }
    ] },
  { id: "kobu-kobu-fruit", name: "コブコブの実", type: "超人系", subtype: null,
    desc: "旗を振って人々を「鼓舞」し、本人も知らない力を引き出させる実。ベロ・ベティは一般市民を兵士並みに奮い立たせた。",
    holders: [
      { char: "belo-betty", since: null, until: null, note: null }
    ] },

  // ===== エッグヘッド =====
  { id: "nomi-nomi-fruit", name: "ノミノミの実", type: "超人系", subtype: null,
    desc: "得た知識をすべて記憶し、脳を際限なく大きくできる実。ベガパンクは肥大化した脳を「パンクレコーズ」として切り離し、知識を蓄え続けた。",
    holders: [
      { char: "vegapunk", since: null, until: "egghead", note: "エッグヘッドで殺害された" }
    ] }
];
