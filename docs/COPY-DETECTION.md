# Code Provenance & Copy-Detection Strategy Guide

**Project**: Align Resume Studio  
**Author**: Rahul Kumar  
**Copyright**: © 2026 Rahul Kumar  
**License**: [Proprietary - All Rights Reserved](../LICENSE)  
**Canonical Provenance ID**: `align-resume-studio-core-2026-9a84b2c1`

---

## 1. Reality of Source Code Protection on Public Repositories

When source code is hosted on a public repository or distributed under an open-source license:
- **Cloning Cannot Be Silently Detected**: Git clone, download zip, and browser viewing operations do not notify the repository owner or generate client-side callbacks. Anyone can clone a public repository without leaving telemetry.
- **No Covert Tracking or Surveillance**: This repository strictly rejects covert telemetry, spyware, tracking beacons, hidden phone-home scripts, or telemetry pixels. All source verification and comparison tools are 100% offline, local, and transparent.
- **Proprietary License Parameters**: This repository is governed by a proprietary [All Rights Reserved](../LICENSE) license. Copying, modification, redistribution, sublicensing, or commercial exploitation is strictly prohibited without prior written authorization. Copy detection is utilized to verify provenance and detect unauthorized duplication.

---

## 2. Searching for Suspected Derivative Works

To monitor public platforms for unauthorized or non-attributive copies:

### A. Searching Distinctive Implementation Signatures
Generic function names like `login` or `handleSubmit` produce millions of false positives. Instead, search for distinctive, custom implementation phrases unique to Align Resume Studio:

1. **Unique Provenance Identifier**:
   - Query: `"align-resume-studio-core-2026-9a84b2c1"`
   - Search on GitHub: `https://github.com/search?q="align-resume-studio-core-2026-9a84b2c1"&type=code`

2. **Distinctive Business Logic Signatures & Service Methods**:
   - Query: `"calculate_ats_readability"` OR `"extract_hard_soft_skills"`
   - Query: `"Align Resume Studio - LLM-Powered Resume Customizer"`
   - Query: `"Dynamic Job Description Auto-Stretch" "ceiling"`
   - Query: `"align_auth" "align_auth_user"`
   - Query: `"build_diff_matrix"` / `"fallback_tailor_resume"`

3. **Unique Prompt Formulations & System Instructions**:
   - In `backend/app/services/llm_service.py`:
     Search distinctive prompt phrases:
     `"You are an expert career counselor. Write an authentic, professional, and convincing cover letter."`
     `"Do not include placeholder brackets like [Your Name]"`

### B. Searching External Search Engines & Archive Mirrors
Use Google or DuckDuckGo with exact string quotes and GitHub filtering:
```text
site:github.com "align-resume-studio-core-2026-9a84b2c1"
site:github.com "Align Resume Studio API" "Rahul Kumar"
```

---

## 3. The Role and Limits of Project Markers

### What the Marker Provides
The project includes a documented provenance constant in `frontend/src/app/page.tsx` and `backend/app/config.py`:
```ts
export const PROJECT_PROVENANCE_ID = "align-resume-studio-core-2026-9a84b2c1";
```
- It provides a definitive keyword for search engines and code scrapers to index.
- If someone duplicates the repository or components verbatim without auditing, the marker persists and immediately proves provenance.

### Limitations of Project Markers
- **Easily Removable**: Anyone deliberately intending to conceal code reuse can delete the constant, rename variables, or reformat whitespace in seconds.
- **Not a DRM or License Enforcer**: A marker does not restrict execution, encrypt binaries, or telephone home. It is solely an open provenance beacon.

---

## 4. Comparing Suspected Source Trees Locally

If a suspected copy or derivative repository is discovered, use the included local comparison utility [`scripts/compare-sources.mjs`](../scripts/compare-sources.mjs):

```powershell
# Compare current repository against an external directory
npm run compare -- <path-to-target-directory> <path-to-suspect-directory>
```

### Example Usage
```powershell
# Basic comparison
npm run compare -- . "C:\Users\Rahul\Downloads\suspected_clone"

# Deep similarity analysis for unique/relocated files with a 70% threshold
npm run compare -- . "C:\Users\Rahul\Downloads\suspected_clone" --threshold 0.70 --deep

# Export raw JSON results for legal review
npm run compare -- . "C:\Users\Rahul\Downloads\suspected_clone" --json > evidence/audit-comparison.json
```

---

## 5. Understanding Comparison Metrics

| Metric | Meaning | Technical Implication | Legal Interpretation |
| :--- | :--- | :--- | :--- |
| **Exact SHA-256 Match** | Content is 100% byte-for-byte identical (with LF normalization). | File was directly copied or mirrored without changes. | Strong technical evidence of verbatim copying. Actionable infringement of proprietary license without prior written authorization. |
| **Relocated Match** | Identical SHA-256, but file is located in a different directory. | File was reorganized or moved into a different folder structure. | Direct code reuse despite directory restructuring. |
| **Modified / Token Similarity (e.g. 80-95%)** | High overlap in unique identifiers, algorithm tokens, and structures. | Code was cosmetically edited (variable renaming, comments removed, imports reordered). | **Potential similarity only.** Does not constitute conclusive proof of copyright infringement; requires human expert code audit. |
| **Unique File** | Found in only one directory. | Added feature, proprietary module, or removed component. | Represents divergent development. |

> **CAUTION**: Automated token similarity tools measure syntactic resemblance. They cannot distinguish between shared open-source boilerplate, standard framework conventions (e.g. Next.js router conventions), and actual copied proprietary logic. Always inspect diffs manually.

---

## 6. Authorized Security Audit Boundaries

When conducting provenance audits:
1. **Never Scan Private Systems Without Written Authorization**: Do not attempt to access private repositories, company intranets, private cloud buckets, or protected APIs without explicit legal consent.
2. **Never Inject Telemetry**: Do not introduce hidden trackers, IP-logging webhooks, or dynamic payloads into source code.
3. **Respect Proprietary Licensing**: Reproduction, redistribution, or commercial reuse requires prior written authorization from the copyright holder (`Rahul Kumar`).
