# 0009. 開発プロセスは t_wada流TDD + Conventional Commits を採用する

## Status

Accepted (2026-07-08)

## Context

個人開発かつ段階的に機能を積み上げていくプロジェクトであり、後から挙動を変えたときに壊れたことにすぐ気付けるようにしたい。特に `quiz.ts` の復習キューやスコア計算のような「一見単純だが不変条件を壊しやすい」ロジック、`storage.ts` のフォールバック処理、`piano.ts` のiOS対応のような外部依存を含む処理は、テストなしでの変更が危険度が高い。

## Decision

- 実装は t_wada流のTDD(Red→Green→Refactor)で進める。純粋ロジック(`notes.ts` / `levels.ts` / `quiz.ts` / `format.ts` / `storage.ts`)はテストファーストで実装し、現在Vitestで71件のテストがある(`npm run test` で実行)。
- 外部依存(`AudioContext` / smplrのインスタンス生成)はDI可能な関数として持ち、`piano.ts` の `_resetForTest()` でテスト用のフェイク実装に差し替えられるようにする。これによりWeb Audio APIやサンプルロードをモックせずにテストが書ける。
- コミットは都度行い、コミットメッセージは Conventional Commits(`feat: / fix: / chore: / docs:` など)に従う。実装計画書のPhaseごと(足場→コアロジック→縦切り→音→進行の仕上げ→プロフィール/永続化/統計→磨き/公開)に沿って、機能単位の小さなコミットを積み重ねる。
- CI(GitHub Actions)はビルド前に `npm run test` を必須ステップとして実行し、テストが通らないコミットはデプロイされない(ADR 0008参照)。

## Consequences

- ロジック層の変更に対する回帰検知が効くため、後から譜表・レベル・進行ルールなどを調整しても壊れにくい。
- 外部依存をDIで切り離した設計により、実機でしか確認できないブラウザAPI(AudioContext, localStorage)への依存を単体テストの対象から分離できている。
- git log の履歴自体が「どのフェーズで何を実装したか」を追える設計ドキュメントとしても機能しており、ADR作成時の一次資料としても利用した。
- 一方でUIの見た目・実際のタップ操作感・iOS Safariでの音再生といった領域はVitestでは検証できず、実機確認や `?debug` ページでの目視確認に頼る部分が残る。
