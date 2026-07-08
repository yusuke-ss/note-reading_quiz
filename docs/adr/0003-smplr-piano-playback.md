# 0003. ピアノ音源に smplr(SplendidGrandPiano)を採用する

## Status

Accepted (2026-07-08)

## Context

鍵盤タップ時と不正解時の正解音提示のために、リアルなピアノ音を再生したい。Web Audio APIを直接使ってサンプル管理・キャッシュ・再生を自前実装するのは手間が大きく、既存のサンプルベースの音源ライブラリを使うのが合理的。また、iOS Safariでは `AudioContext` の生成・再生開始がユーザー操作(タップ)のコールスタック内で行われないと音が鳴らない/サスペンドされたままになるという制約があり、これへの対処が必須要件になる。

## Decision

- ピアノ音源には smplr の `SplendidGrandPiano` を採用する(`src/audio/piano.ts`)。smplr 1.0 のファクトリ関数 API(`SplendidGrandPiano(context, {...})` + `.ready` プロミス)を使う(コンストラクタ+`.loaded()` という旧APIとは異なる点に注意)。
- サンプルは `CacheStorage()` を介してブラウザにキャッシュし、2回目以降のロードを高速化する。
- `AudioContext` の生成と `resume()` は必ずユーザージェスチャ(ボタンの `onClick` など)内で呼ばれる `initPiano()` の中で行い、`await` せずに即座に呼び出す。
- `playNote()` 内でも `audioContext.state === 'suspended'` なら防御的に `resume()` を呼ぶ。これはiOS Safariでバックグラウンドから復帰した際にコンテキストが再度サスペンドされるケースへの対策。
- テスト容易性のため `createContext` / `createInstrument` を差し替え可能な関数として持ち、`_resetForTest()` でフェイク実装に切り替えられるようにしている。

## Consequences

- iOS Safariを含む主要モバイルブラウザで、初回タップから安定して発音できる。
- `initPiano` はモジュールレベルのシングルトン状態(`audioContext` / `instrument` / `readyPromise`)を持つため、複数箇所から呼んでも二重初期化されない。
- 実機(特にiOS Safari)での動作確認が必要な箇所であり、Vitestだけでは検証しきれない領域が残る(実装計画書にも実機確認が明記されている)。
- ロード進捗(`onLoadProgress`)や読み込み状態(`idle/loading/ready`)を購読可能なスナップショットとして公開し、UI側でローディング表示に利用している。
