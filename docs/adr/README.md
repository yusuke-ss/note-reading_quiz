# Architecture Decision Records

音符読みクイズアプリの主要な設計判断を記録する。フォーマットはMADR風の簡易版(Status / Context / Decision / Consequences)。

| # | タイトル | Status |
|---|---|---|
| [0001](0001-react-vite-typescript-no-router.md) | 技術スタックに React 19 + Vite + TypeScript を採用し、ルーターは使わない | Accepted |
| [0002](0002-vexflow-for-staff-rendering.md) | 楽譜描画に VexFlow 5 を採用する | Accepted |
| [0003](0003-smplr-piano-playback.md) | ピアノ音源に smplr(SplendidGrandPiano)を採用する | Accepted |
| [0004](0004-localstorage-persistence.md) | 永続化に localStorage を採用し、バージョン付きスキーマで管理する | Accepted |
| [0005](0005-quiz-state-machine-and-review-queue.md) | クイズ進行を useReducer の純粋な状態機械 + FIFO 復習キューで実装する | Accepted |
| [0006](0006-strict-octave-white-key-solfege-judging.md) | 判定はオクターブ厳密・白鍵のみ・音名はドレミ表記とする | Accepted |
| [0007](0007-mobile-landscape-layout-strategy.md) | モバイル横向き対応のレイアウト戦略 | Accepted |
| [0008](0008-github-pages-actions-deploy.md) | GitHub Pages + GitHub Actions でデプロイする | Accepted |
| [0009](0009-tdd-conventional-commits-workflow.md) | 開発プロセスは t_wada流TDD + Conventional Commits を採用する | Accepted |
