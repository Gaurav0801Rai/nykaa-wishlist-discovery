# FINDINGS — Nykaa Fashion wishlist→purchase discovery

Analysis of **276 pieces of real user feedback** about shopping on Nykaa Fashion and about wishlist shopping generally, collected from Play Store (159), Reddit (84), Community & web (13), Review forums (10), Q&A sites (10).

Every item was read and tagged by hand against a 15-blocker taxonomy. Tagging is multi-label, so an item can carry several blockers and the percentages do not sum to 100. Items showing no blocker were left untagged rather than forced into one.

## Ranked blockers
| # | Blocker | Theme | Items | % of 276 |
|---|---------|-------|------:|------:|
| 1 | Delivery / return friction | Post-purchase | 158 | 57.2% |
| 2 | Trust / authenticity | Confidence gap | 63 | 22.8% |
| 3 | Price wait | Value & timing | 42 | 15.2% |
| 4 | Quality doubt | Confidence gap | 38 | 13.8% |
| 5 | Decision paralysis | Decision friction | 30 | 10.9% |
| 6 | Confidence / validation gap | Confidence gap | 23 | 8.3% |
| 7 | Fit / size doubt | Confidence gap | 23 | 8.3% |
| 8 | Comparison gap | Decision friction | 21 | 7.6% |
| 9 | Bookmarking, no intent | Decision friction | 17 | 6.2% |
| 10 | Context loss / wishlist visibility | Decision friction | 15 | 5.4% |
| 11 | Occasion / timing | Value & timing | 10 | 3.6% |
| 12 | Size / stock gone | Availability | 10 | 3.6% |

## By theme
| Theme | Items | % |
|-------|------:|--:|
| Post-purchase | 158 | 57.2% |
| Confidence gap | 116 | 42.0% |
| Decision friction | 67 | 24.3% |
| Value & timing | 50 | 18.1% |
| Availability | 10 | 3.6% |

## What the data shows

**Public review writing is dominated by what happens after checkout.** Delivery and return friction appears in 158 items (57.2%), and the confidence cluster — trust, quality, validation and fit — in 116 (42.0%). Both are reported by people who had already ordered.

**Friction while an item is still saved is a distinct, smaller signal.** Decision friction appears in 67 items (24.3%), led by decision paralysis (30), the comparison gap (21), saving without buying (17) and context loss (15).

**Category profiles differ.** Apparel feedback carries fit and quality doubts; beauty feedback is led by validation-seeking and price waiting. Most items do not name a category, so category splits describe the named ones only.

Full data: `web/src/data/classified.json`. Per-item tags: `data/claude_tags*.json`. Live site: the Dashboard, Ask Assistant and Live Analyzer under `web/`.
