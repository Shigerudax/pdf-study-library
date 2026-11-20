#!/usr/bin/env python3
"""科目別フォルダー内のPDFからGitHub Pages用教材一覧を生成する。"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUBJECTS = ("英語", "数学", "国語", "理科", "社会", "情報")
CATEGORIES = ("共通テスト用", "二次試験用", "基礎確認事項")
OUTPUT = ROOT / "materials.json"

def title_from_filename(filename: str) -> str:
    stem = Path(filename).stem
    stem = re.sub(r"\s*\(\d+\)$", "", stem)
    stem = stem.replace("_", " ").replace("-", " ")
    return re.sub(r"\s+", " ", stem).strip()

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
                })
    return records

if __name__ == "__main__":
    result = build()
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(result)} 件を {OUTPUT.name} に出力しました")
