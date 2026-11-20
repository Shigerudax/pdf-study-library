#!/usr/bin/env python3
"""科目別フォルダー内のPDFからGitHub Pages用教材一覧を生成する。"""
# GitHub Actionsによる教材一覧・アップロード日時の再生成を要求。
import json
import subprocess
from datetime import datetime, timezone
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUBJECTS = ("英語", "数学", "国語", "理科", "社会", "情報")
CATEGORIES = ("共通テスト用", "二次試験用", "基礎確認事項")
OUTPUT = ROOT / "materials.json"

# 表示用タイトル。PDFファイル名・URLは変更しない。
TITLE_OVERRIDES = {
    "kobun_words_400_vertical": "古文重要単語400語一覧",
    "kyotsu_test_chemistry_basics": "共通テスト化学基礎｜重要ポイントと出題対策",
    "共通テスト物理_出題分析と要点": "共通テスト物理｜出題分析と重要ポイント",
    "metal_ions_precipitation_charge_readable": "金属イオン｜沈殿・電荷・反応一覧",
    "world_geography_corrected_economies": "世界地誌｜各地域の産業・経済の特徴",
    "kyotsu_info1_code_notation_guide": "共通テスト情報Ⅰ｜プログラムの表記と読み方",
    "synthetic_polymers_materials_reactions_table": "合成高分子化合物｜原料・製法・反応一覧",
    "amino_acids_20_structure_groups_features": "アミノ酸20種類｜構造式・分類・特徴",
    "共通テスト政治経済_要点と暗記": "共通テスト政治・経済｜重要事項と暗記ポイント",
}

def title_from_filename(filename: str) -> str:
    stem = Path(filename).stem
    stem = re.sub(r"\s*\(\d+\)$", "", stem)
    if stem in TITLE_OVERRIDES:
        return TITLE_OVERRIDES[stem]
    stem = stem.replace("_", " ").replace("-", " ")
    return re.sub(r"\s+", " ", stem).strip()

def upload_datetime(path: Path) -> str | None:
    """Git履歴で確認できる最初の追加コミット日時（UTC、ISO 8601）。"""
    relative = path.relative_to(ROOT).as_posix()
    command = ["git", "-C", str(ROOT), "log", "--follow", "--diff-filter=A",
               "--format=%aI", "--", relative]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    dates = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    if not dates:
        result = subprocess.run(
            ["git", "-C", str(ROOT), "log", "-1", "--format=%aI", "--", relative],
            capture_output=True, text=True, check=False)
        dates = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    if not dates:
        return None
    try:
        return datetime.fromisoformat(dates[-1]).astimezone(timezone.utc).isoformat()
    except ValueError:
        return None


def build():
    records = []
    for subject in SUBJECTS:
        for category in CATEGORIES:
            directory = ROOT / subject / category
            if not directory.is_dir():
                continue
            for path in sorted(directory.rglob("*"), key=lambda p: p.as_posix().casefold()):
                if not path.is_file() or path.suffix.lower() != ".pdf":
                    continue
                relative = path.relative_to(ROOT).as_posix()
                records.append({
                    "title": title_from_filename(path.name),
                    "subject": subject,
                    "category": category,
                    "file": relative,
                    "uploaded_at": upload_datetime(path),
                })
    daily_dir = ROOT / "毎日の知識補充問題"
    if daily_dir.is_dir():
        for path in sorted(daily_dir.rglob("*"), key=lambda p: p.as_posix().casefold()):
            if not path.is_file() or path.suffix.lower() != ".pdf":
                continue
            records.append({
                "title": title_from_filename(path.name),
                "subject": "毎日の知識補充問題",
                "category": "毎日の知識補充問題",
                "file": path.relative_to(ROOT).as_posix(),
                "uploaded_at": upload_datetime(path),
            })
    return records

if __name__ == "__main__":
    result = build()
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(result)} 件を {OUTPUT.name} に出力しました")
