---
description: 初期設定を自動確認し、人間が必要な作業だけ案内する
---

# Setup

この command は、初期設定をできるだけ自動で進めるための入口です。

## 実行方針

1. まず次を実行して、repo の状態を自動で集める。

```bash
npm exec --yes --package @takahiro-shimizu-1/automation-runner@0.1.30 -- automation-runner setup --apply --json
```

2. 出力の `autoCommands` に、人間の秘密情報が不要で安全に実行できる command があれば実行する。
3. `humanSteps` が空なら、設定完了として次に進む。
4. `humanSteps` がある場合だけ、ユーザーに依頼する。
5. secret / token / password が必要な場合は、repo のファイルには書かせず、GitHub Actions secret か local の未commit `.env` に登録する手順だけを出す。
6. 人間が登録したあと、もう一度この command を実行して `humanSteps` が空になったか確認する。

## ユーザーに頼むときのルール

- 1回に1ステップだけ伝える
- 何のための作業かを無知の無知向けに説明する
- token / secret / password の値はチャットに貼らせない
- token / secret / password の値を README、docs、Issue、PR、workflow、`.env.example`、`.npmrc.example` に書かせない
- できることは先にこちらで実行し、聞けば分かることをユーザーに聞かない

## 追加で確認するもの

- `git remote -v`
- `gh auth status`
- `gh repo view --json nameWithOwner,isPrivate,defaultBranchRef`
- `gh secret list`
- `docker info`
- `npm exec --yes --package @takahiro-shimizu-1/automation-runner@0.1.30 -- automation-runner setup --apply`
