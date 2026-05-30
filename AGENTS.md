# App Repo Instructions

この repo は shared runner で Miyabi automation を使う app repo です。

## Miyabi Setup Intake

ユーザーが `/setup`、初期設定、セットアップ、自動設定を依頼した場合は、Issue 化せず Miyabi setup intake として扱う。

- 目的は「初期設定に必要な情報」を Claude Code / Codex が先に集め、自動でできることを済ませること
- まず `automation-runner setup --apply --json` を実行する
- `autoCommands` に秘密情報なしで実行できる command があれば実行する
- `humanSteps` が空なら、設定完了として結果だけ報告する
- `humanSteps` がある場合だけ、ユーザーに1ステップずつ依頼する
- token / secret / password の値はチャットに貼らせない
- Claude Code では `/setup` または `.claude/commands/setup.md` を使う
- Codex ではこの `AGENTS.md` の指示に従い、同じ流れを実行する

## Miyabi Request Intake

ユーザーが実装・修正・追加・削除・リファクタ・テスト追加を雑に依頼し、かつ直接ローカル編集を明示していない場合は、まず Miyabi request intake として扱う。

- 目的は「チャットの雑な要望」を GitHub Issue に変換し、既存の `issue-opened` / `autonomous-agent` workflow に渡すこと
- 質問、説明依頼、調査だけの依頼、レビュー依頼は勝手に Issue 化しない
- Claude Code では `/miyabi-request` または `.claude/skills/miyabi-request/SKILL.md` を使う
- Codex ではこの `AGENTS.md` の指示に従い、同じ Issue 本文構造を使う
- `🤖agent-execute` はデフォルトで付けない。通常は issue open で planning が走る
- Issue 本文には必ず `## Tasks` を入れる。小さい依頼は1件、大きい依頼や横断依頼は2-6件の独立した作業にAIが分ける
- `## Tasks` は automation が子 Issue 分解に使う入口なので、単なる要望の言い換えではなく「実行できる作業」にする
- 横断修正が疑われる場合は Issue 本文に `## ImpactDecision` を入れる。intake 時点で未解決なら planning で resolver が確定する前提を書く
- required repo が分かっている場合は `## Tasks` に repo 名を入れる。不明なら `Impact Hints` に候補だけを書く

## Miyabi Execution Ledger

Execution Ledger は、Miyabi automation が「どの task を、どの branch / PR / merge / 検証で進めたか」を残す実行台帳です。

- 正本の event log は `project_memory/execution-events.jsonl`
- 現在地の snapshot は `project_memory/execution-snapshot.json`
- 既存互換の見える状態は `project_memory/tasks.json`
- GitHub Actions は実行後に `automation-runner ledger project` と `automation-runner ledger validate` を呼び、`.ai/parallel-reports/` と `project_memory/` に証跡を出します
- これらは source code ではなく実行結果なので commit しません
- PR gate / auto-merge は `MIYABI_LEDGER_PR_MARKER_MODE` を見ます。未設定なら observe で、`enforce` にすると Ledger marker / task binding の欠落を merge gate で止めます

## Issue Body

```markdown
## Request

<ユーザーの依頼を1-3文で整理>

## Goal

<最終的にどうなっていればよいか>

## Requirements

- <具体的な要件>
- <具体的な要件>

## Tasks

- [ ] <AIが分けた実行可能な作業。小さい依頼なら1件>
- [ ] <大きい依頼や横断依頼なら2-6件に分ける>
- [ ] <required repo が分かっている場合は `owner/repo`: 実行する作業>

## Impact Hints

- Target repo: `<owner/repo or current repo>`
- Related repos: `<わかる範囲。なければ unknown>`
- Likely surfaces: `<API/UI/config/workflow/docs など>`

## ImpactDecision

- Status: `<not-resolved-at-intake | ready | blocked>`
- Decision source: `<planning resolver が実行前に確定する>`
- Required repos: `<unknown、または owner/repo と理由>`
- Required evidence: `pull-request`, `merge-commit`, `ledger-record` for every required repo

## Completion Criteria

- [ ] <確認できる条件>
- [ ] Existing CI / typecheck passes
- [ ] A PR is opened with a clear summary

## Constraints

- Follow `AGENTS.md`
- Do not include secrets or tokens in code, logs, or comments
- Keep changes scoped to the requested behavior

## Automation

- Source: Miyabi request intake
- Initial mode: planning
- Child issue creation: leave to Miyabi decomposition when `## Tasks` shows multiple independent workstreams
- ImpactDecision resolver: run during planning before execution when cross-repo work is possible
```

## 実行

1. `gh repo view --json nameWithOwner -q .nameWithOwner` で対象 repo を確認する。
2. 一時ファイルに Issue body を書く。
3. `gh issue create --repo "<owner/repo>" --title "[Task] <type>: <summary>" --body-file "<body-file>"` で Issue を作る。
4. ユーザーには Issue URL と整理内容だけを短く返す。
