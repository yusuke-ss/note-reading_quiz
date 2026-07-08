# 0004. 永続化に localStorage を採用し、バージョン付きスキーマで管理する

## Status

Accepted (2026-07-08)

## Context

家族で共有する端末上で、複数人(プロフィール)がそれぞれの設定・成績を保存したい。要件はあくまで「端末内でのプロフィール切り替え」であり、複数端末間の同期やアカウント管理は求められていない。サーバーを持たずGitHub Pagesで静的配信するという構成上、バックエンドを新設するコストは要件に見合わない。

## Decision

- 永続化は `localStorage` のみを使う(`src/lib/storage.ts`)。単一キー `note-quiz:v1` に、バージョン番号・アクティブプロフィールID・プロフィール配列をまとめて1つのJSONとして保存する。
- スキーマは `{ version: 1, activeProfileId, profiles: Profile[] }`。各 `Profile` は `id / name / createdAt / settings(clef, level, showKeyLabels, muted) / sessions[] / noteStats` を持つ。
- `load()` は `isPersistedData()` による型ガードを通し、`localStorage` へのアクセス自体が失敗する場合(プライベートブラウジング等)や、保存データが壊れている/バージョン不一致の場合は初期値(空のプロフィール配列)にフォールバックする。
- セッション履歴は `sessions` に追記し、上限200件を超えたら古いものから間引く(`MAX_SESSIONS`)。
- 音ごとの正答率は `noteStats` に `${clef}:${noteId}`(例: `treble:C4`)をキーとして集計し、同じ音名・オクターブでもト音/ヘ音で別々に統計を取る。

## Consequences

- サーバー不要でシンプルに複数プロフィールの分離ができる一方、端末をまたいだ引き継ぎはできない(要件上は許容)。
- JSONパース失敗やスキーマ不一致でもアプリがクラッシュせず初期状態から再開できる、フォールバック前提の設計になっている。
- `version: 1` を型ガードでチェックしているため、将来スキーマを変更する際はマイグレーション処理を追加する余地を残している(現時点では未実装)。
- 書き込みはセット終了時(`recordSession`)と設定変更時(`updateSettings`)のみで、クイズ進行中の毎回のタップでは発生しない。
