# Kimi data hand-off — blocked seed sources

Fill in verbatim user text from the sources this sandbox could not reach.
Rules:
- One item per block. Separate blocks with a line containing only three dashes: ---
- `source` and `text` are REQUIRED. `url`, `date`, `rating`, `category_hint` optional.
- `text` must be VERBATIM (the real review/answer/comment), not a summary. It may span multiple lines.
- `source` must be one of: trustpilot, pissedconsumer, reddit, quora, youtube, twitter
- Collect ACROSS categories (apparel, footwear, watches, sunglasses, bags, belts, jewellery, makeup) — not just clothing.
- Keep anything about the save→buy / wishlist / browse / "why I didn't buy a saved item" decision moment.
- It's fine to also include delivery/return/quality complaints — we filter those in Stage 2, don't pre-filter.

Then send me this file and I run:  python src/ingest_md.py data/kimi_import.md

---
source: trustpilot
url: https://www.trustpilot.com/review/nykaafashion.com
date:
rating:
category_hint:
text: PASTE VERBATIM REVIEW HERE
---
source: quora
url: https://www.quora.com/What-is-your-review-of-Nykaa-Fashion
date:
rating:
category_hint:
text: PASTE VERBATIM ANSWER HERE
---
source: reddit
url: https://www.reddit.com/r/IndianFashionAddicts/comments/xxxx/
date:
rating:
category_hint:
text: PASTE VERBATIM POST OR COMMENT HERE
