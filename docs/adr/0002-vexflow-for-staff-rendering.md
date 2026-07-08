# 0002. 楽譜描画に VexFlow 5 を採用する

## Status

Accepted (2026-07-08)

## Context

クイズ画面では五線譜上に音符を1つだけ描画すればよい(全音符・符幹なし)。加線(ledger line)を含む五線譜の正確な描画、ト音記号/ヘ音記号の切り替え、SVG出力による拡大縮小への追従が必要になる。これを自前実装するのはコストが高く、実績のある楽譜描画ライブラリに任せるのが妥当と判断した。

## Decision

- 楽譜描画ライブラリとして VexFlow 5 を採用する。
- SVGバックエンド(`Renderer.Backends.SVG`)を使い、ESM の named exports(`Renderer`, `Stave`, `StaveNote`, `Voice`, `Formatter`)から必要なクラスのみを利用する(`src/components/StaffDisplay.tsx`)。
- 利用範囲は限定的で、1小節に全音符(`duration: 'w'`)1つだけを配置する構成に絞る。複数音符・複数声部・リズム表現などVexFlowが持つ高度な機能は使わない。
- 毎回 `container.innerHTML = ''` して `useEffect` 内で全再描画する(差分更新はしない)。

## Consequences

- 加線の自動描画・五線譜のレイアウト計算をVexFlowに任せられるため、クイズ本体のロジック(出題・判定)に集中できる。
- 単一音符という限定用途のため、VexFlowが持つ機能のごく一部しか使っておらず、将来「和音を出題する」等の拡張時にはAPI理解を広げる必要がある。
- 全再描画方式のため、React側は `clef` / `level` / `note` が変わるたびにDOMを作り直すコストを払うが、1音符描画のみなので実用上問題にならない。
- 描画結果のSVGはレベルごとに固定 viewBox でクロップして拡大表示している(詳細は ADR 0007)。
