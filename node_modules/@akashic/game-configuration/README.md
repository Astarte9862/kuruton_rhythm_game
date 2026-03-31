<p align="center">
<img src="https://raw.githubusercontent.com/akashic-games/game-configuration/main/img/akashic.png" />
</p>

# game-configuration
game.json の型定義および正規化処理を提供します。
**ゲーム開発者(Akashic Engineの利用者)がこのモジュールを直接利用する必要はありません**。

## インストール

Node.jsが必要です。次のコマンドでインストールできます。

```
npm install @akashic/game-configuration
```

## ビルド方法

TypeScriptで書かれています。インストール後にビルドしてください。

```sh
npm install
npm run build
```

## 利用方法

### 型として参照する場合

任意の TypeScript ファイル内でモジュールのルートを `import` してください。

```javascript
import {...} from "@akashic/game-configuration";
```

### game.json の正規化処理を利用する場合

`@akashic/game-configuration/lib/utils` を `require()` してください。

`utils.makeLoadConfigurationFunc()` を利用する場合、`es6-promise` を別途インストールする必要があります。

```javascript
var utils = require("@akashic/game-configuration/lib/utils");

...

var loadConfiguration = utils.makeLoadConfigurationFunc(loadGameConfiguration);
loadConfiguration(...);
```

## テスト方法

```
npm test
```


## ライセンス
本リポジトリは MIT License の元で公開されています。
詳しくは [LICENSE](https://github.com/akashic-games/game-configuration/blob/main/LICENSE) をご覧ください。

ただし、画像ファイルおよび音声ファイルは
[CC BY 2.1 JP](https://creativecommons.org/licenses/by/2.1/jp/) の元で公開されています。
