# Test Strategy

## Overview

テストは2層構成。

| 層 | ツール | 対象 | 実行タイミング |
|---|---|---|---|
| Unit | Vitest | 純粋関数（geometry, validation, download） | 各フェーズ実装後 |
| UI/E2E | Chrome devtools MCP | ブラウザ上の Acceptance Criteria | 各フェーズ完了後 |

---

## Layer 1: Vitest（ユニットテスト）

### 対象モジュール

| ファイル | テスト対象関数 |
|---|---|
| `src/tests/geometry.test.ts` | `toRad`, `toDeg`, `getApexAngleDeg`, `getInputTriangle`, `getVideoPointFromPointerEvent` |
| `src/tests/download.test.ts` | ファイル名生成ロジック |
| `src/tests/validate.test.ts` | バリデーション条件（Section 15 全項目） |

### 実行コマンド

```sh
npm test          # 一回実行
npm run test:watch  # ウォッチモード（開発中）
npm run test:ui     # Vitest UI
```

### 方針

- ブラウザ API（Canvas, HTMLVideoElement）は不要な純粋関数のみ対象
- DOM 依存のモジュール（`renderer.ts`, `video.ts`, `frameExtractor.ts`）はユニットテストではなく Chrome devtools MCP でカバー
- テストは `src/tests/` 以下に配置

---

## Layer 2: Chrome devtools MCP（UI/E2E テスト）

### AC ファイル規約

Chrome devtools MCP でテストを実行する前に、必ず対応する `tests/AC1xxx.md` を作成してからテストを開始する。

| ファイル | 対応フェーズ | spec.md 参照 |
|---|---|---|
| `tests/AC1001.md` | Phase 1: Project setup | Section 20 Phase 1 |
| `tests/AC1002.md` | Phase 2: Video loading | Section 12.1, 21.1 |
| `tests/AC1003.md` | Phase 3: Sample point + guide | Section 12.2, 12.3, 21.2, 21.3 |
| `tests/AC1004.md` | Phase 4: Frame extraction | Section 12.4, 21.4 |
| `tests/AC1005.md` | Phase 5: Radial rendering | Section 12.5, 21.4 |
| `tests/AC1006.md` | Phase 6: Download + Error handling | Section 12.6, 21.5, 21.6 |

### AC ファイル形式

```md
# AC1xxx — [フェーズ名]

## 前提条件
- ...

## テスト手順

### TC-xxx-01: [テストケース名]
1. ...
2. ...

Expected: ...

### TC-xxx-02: ...
```

### テスト実施手順

1. フェーズの実装が完了し `npm run dev` でアプリが起動していること
2. 対応する `tests/AC1xxx.md` を作成・確認する
3. Chrome devtools MCP でブラウザを操作し、AC ファイルの各テストケースを実行する
4. 結果を AC ファイルに記録する（Pass / Fail）

---

## タスク一覧

test タスクは `task.md` の T17〜T22 を参照。
