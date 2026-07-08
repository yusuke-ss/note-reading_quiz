# 0008. GitHub Pages + GitHub Actions でデプロイする

## Status

Accepted (2026-07-08)

## Context

サーバーを持たない静的サイトとして公開したい。リポジトリはGitHub上にあり、追加のホスティング費用や運用負荷をかけずに、mainブランチへのpushをそのまま本番反映につなげたい。

## Decision

- ホスティング先は GitHub Pages とし、GitHub Actions の公式Pagesワークフロー方式(`actions/configure-pages` → `actions/upload-pages-artifact` → `actions/deploy-pages`)を使う(`.github/workflows/deploy.yml`)。
- ワークフローは `main` ブランチへの push と手動実行(`workflow_dispatch`)をトリガーとし、`checkout → setup-node(22系) → npm ci → npm run test → npm run build → configure-pages → upload-pages-artifact → deploy-pages` の順で実行する。テストが落ちればビルド・デプロイは行われない。
- 同時実行は `concurrency: { group: pages, cancel-in-progress: false }` とし、進行中のデプロイは中断せず、新しいpushは待機させる。
- Vite側は `vite.config.ts` の `base: '/note-reading_quiz/'` をリポジトリ名に合わせて設定し、GitHub Pagesのプロジェクトページ配下(`https://yusuke-ss.github.io/note-reading_quiz/`)でアセットパスが正しく解決されるようにする。
- リポジトリ設定側は Settings > Pages の Source を「GitHub Actions」にする(コード管理外の手動設定)。

## Consequences

- mainへのpushだけで自動的にテスト→ビルド→公開まで完結し、手動デプロイ手順が不要になる。
- テストが通らないコミットは公開されない、というゲートがワークフロー自体に組み込まれている。
- `base` パスの設定漏れはGitHub Pages特有の「アセットが404になる」不具合に直結するため、ローカルの `npm run build && npm run preview` で確認してから公開する運用を実装計画書でも明記している。
