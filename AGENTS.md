# Repository instructions

## Communication

- 日本語で簡潔に報告する。
- 不明点が実装結果を左右する場合は、推測せず確認する。

## Development

- Node.js 22 と npm を使用する。
- 依存関係は `npm ci` でインストールする。
- UI変更では、スマートフォンの縦向きと横向きの両方を考慮する。
- ユーザーから指定がない限り、新しい本番依存関係を追加しない。

## Verification

変更後は次をすべて実行する。

```sh
npm test
npm run lint
npm run build
```

## Deployment

- GitHub Pages向けの通常ビルドでは、Viteのベースパス `/note-reading_quiz/` を維持する。
- Cloudflare Pagesのプレビューでは、ルートURLで配信するため `npm run build -- --base=/` を使用する。
- ビルド出力ディレクトリは `dist`。
- `main` へのマージ前に、Cloudflare PagesのPRプレビューをスマートフォンで確認する。
