import json
import re
from pathlib import Path

# Path to your SCOWL word list
source_file = Path("en_US-large.txt")

# Output directory
output_dir = Path("output_jsons")
output_dir.mkdir(exist_ok=True)

# Read file and clean
with open(source_file, "r", encoding="utf-8") as f:
    raw_words = [w.strip() for w in f if w.strip()]

# ✅ Filter rules:
# - Keep only lowercase a–z (no uppercase, digits, or punctuation)
# - No apostrophes, hyphens, or periods
# - Length between 5 and 10
clean_words = [
    w.lower()
    for w in raw_words
    if re.fullmatch(r"[a-z]{5,10}", w.lower())
]

print(f"Total clean words (5–10 letters, no apostrophes): {len(clean_words)}")

# Group by word length
for length in range(5, 11):
    filtered = [w for w in clean_words if len(w) == length]
    out_path = output_dir / f"words_{length}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(sorted(filtered), f, ensure_ascii=False, indent=2)
    print(f"✅ Saved {len(filtered)} words to {out_path}")

# Optional: combined file
combined = {str(length): [w for w in clean_words if len(w) == length] for length in range(5, 11)}
with open(output_dir / "words_5to10.json", "w", encoding="utf-8") as f:
    json.dump(combined, f, ensure_ascii=False, indent=2)
print("✅ Combined file saved as words_5to10.json")
