# 0001. 技術スタックに React 19 + Vite + TypeScript を採用し、ルーターは使わない

## Status

Accepted (2026-07-08)

## Context

音符読みクイズアプリはピアノ学習者とその家族向けの小規模な学習ツールで、画面はプロフィール選択・ホーム・クイズ・結果・統計の5つ程度に収まる。GitHub Pages への静的配信のみを想定しており、サーバーサイドの処理やURLごとの深いリンク(共有・ブックマーク)は要件にない。開発体験としては高速な起動・HMR・型安全性が欲しい。

## Decision

- React 19 + Vite + TypeScript でプロジェクトを構成する(`npm create vite` の react-ts テンプレートを起点に初期化)。
- 画面遷移には React Router 等のルーティングライブラリを導入せず、`src/App.tsx` の `useState<Screen>` によるシンプルなステートマシンで `'profiles' | 'home' | 'quiz' | 'result' | 'stats'` を切り替える。
- URL は常に単一パス(GitHub Pages の `base: '/note-reading_quiz/'` 配下)のままとし、画面ごとのURL遷移やブラウザ履歴連携は行わない。

## Consequences

- ルーティングライブラリの依存・設定・バンドルサイズが不要になり、画面遷移ロジックが `App.tsx` を読むだけで完結して見通しやすい。
- 一方で「結果画面を直接URLで開く」「戻るボタンで前の画面に戻る」といった挙動は提供されない。要件上は許容範囲だが、将来的に画面数が増えたりURL共有が必要になった場合はルーター導入を再検討する。
- クイズ再挑戦時は `quizKey` を incrementして `QuizScreen` を再マウントすることで `useReducer` の状態をリセットしており、ルーターがない分の「同一画面の再初期化」はコンポーネントキーの明示的な変更で代替している。
