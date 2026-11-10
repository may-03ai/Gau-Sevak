# Source Specifications

## Available References
- `Gau-Sevak_Master_System_Prompt_V2.0.pdf`: 105 pages; original product and technical blueprint, Parts 1–60.
- `Gau-Sevak_V2.1_Corrected_Master_Prompt.pdf`: 18 pages; corrective override pack reviewed 2026-11-10.

V2.1 is not a replacement for the complete V2.0 product specification. Retain both documents: apply V2.1 to conflicts and keep non-conflicting V2.0 requirements as legacy source material pending owner review. V2.1 itself calls for a later consolidated master, but that consolidation is not performed here.

## Inspection Record
Both PDFs were opened with the already-installed Python `pypdf` parser. All 105 V2.0 pages and all 18 V2.1 pages produced non-empty extracted text; no page was skipped from the review. The references were not modified.

Text extraction is not a visual rendering check. Some Indic glyphs and emoji in V2.0 were garbled or represented as escaped surrogate characters in extracted output, including examples in the localization and badge material. Confirm those passages against rendered PDF pages or an authoritative text source before relying on exact copy, symbols, or translations. No OCR tool was available or installed.

## Authority and Change Control
- V2.0 is the broad product blueprint, not evidence that a feature, API contract, legal conclusion, or control is implemented or approved.
- V2.1 controls whenever it conflicts with V2.0 and identifies legal, tax, payment-provider, banking, privacy, and production-readiness approval gates.
- Preserve source files. Record requirement references and decisions in the relevant product/architecture docs and ADRs; label assumptions and unresolved issues explicitly.
- This inspection is documentation work only. It is not legal, accounting, security, provider, or production approval.
