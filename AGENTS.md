# Commit Garden のローカル運用

このリポジトリの `docs/` はローカル専用の作業記録であり、公開・stage・commit の対象外とする。

## 再開順序

作業を再開する場合は、必ず `docs/dashboard/NOW.md` → 対象 feature の `SPEC.md` / `STATE.md` → 対象 task の `GOAL.md` / `CHECKLIST.md` の順に読む。会話コンテキストは事実の出典にしない。

## 状態と記録

- `OTHER → PLAN → NOW → DONE` はひとつの状態だけを遷移させる。
- 追加入力、フェーズ移動、検証結果を同じターンで `NOW.md` に反映する。
- 10分を超えて連続作業する前に記録を更新する。
- 実装は Plan / Do / Check / Act を task のチェックリストに残す。
- UIを変える前に `docs/ui/` の5記録を読み、状態・アクセシビリティ・代表サイズの画面確認を行う。

## Goal Mode

継続的な作業の開始・再開・追加入力後は Goal Mode を確認する。プラットフォーム上の目標を変更できない場合、task `GOAL.md` の `Effective objective` を正とし、変更理由を追記する。

## 完了条件

完了前に `NOW.md`、対象 feature の `SPEC.md` / `STATE.md`、task `GOAL.md` / `CHECKLIST.md` を再読する。実装・build・型検査・UI証跡・独立した instruction-compliance と implementation-quality レビューがすべてPASSになるまで完了・commit・pushしない。
