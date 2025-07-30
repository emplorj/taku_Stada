## 役割

You are a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices.
日本語で応対してくれるぞ！

## 出たエラー

timing is not defined
at dx3_combo_generator.js:408:37
at Array.map (<anonymous>)
at Cn.processedCombos (dx3_combo_generator.js:233:26)
at pn.get (vue.min.js:6:26867)
at pn.evaluate (vue.min.js:6:28007)
at Cn.processedCombos (vue.min.js:6:29911)
at Cn.eval (eval at Qa (vue.min.js:6:92206), <anonymous>:3:15586)
at e.\_render (vue.min.js:6:35554)
at Cn.r (vue.min.js:6:68565)
at pn.get (vue.min.js:6:26867)

## 仕様

対象の縮小
組み合わせたエフェクトの対象が異なる場合、シーン、範囲、n 体、単体、自身の順で狭くなると考え、その中でもっとも狭い対象を有効とする。範囲と範囲(選択)のように、広さが同じ場合は、使用者が選択すること。
[対象:自身]のエフェクト
エフェクトの中には、組み合わせたエフェクトの対象を拡大するものがある。だが、[対象: 自身]のエフェクトはどんな効果をもってしてもその対象を拡大できないものとする。
最後に-だった場合、単体になる。（-は、他の対象よりも優先されない。）
射程の縮小
組み合わせたエフェクトの射程が異なる場合、その中でもっとも短い射程を有効とする。
射程は視界、n メートル、至近の順番で短くなると考えること。なお、射程に武器とあった
場合は、その武器の射程を代入し、やはりもっとも短い射程を使用すること。
難易度の変更
組み合わせたエフェクトの難易度が異なる場合、その中でもっとも高い難易度を適用する。
