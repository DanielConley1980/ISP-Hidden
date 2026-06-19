# ISP Site: Migration from Google Sheets to BigQuery

**Audience:** Data team
**Status:** Proposal / for review
**Author context:** ISP web app currently used by SEN/EP staff across the trust; roster data already flows from Arbor → Snowflake → BigQuery and is consumed read-only by the app. This document covers writing new ISP content into BigQuery, protecting the existing roster table, and a later phase adding AI-generated reporting with pupil anonymisation.

---

## 1. Current state

### Roster data (read path — already exists)
- Table: `coop-trust-data-management.isp_database.isps`
- Populated via the existing Arbor → Snowflake → BigQuery pipeline (outside this app's control).
- Consumed by the app read-only, via OAuth scope `bigquery.readonly`, using a direct `bigquery.googleapis.com/.../queries` call from the browser (`app.js:693-755`).
- Despite the table name, this only holds roster/MIS fields: Arbor ID, UPN, school, name, NC year, attendance, SEN status, etc. **It does not contain ISP content.**

### ISP content (write path — the actual problem)
- Stored via a Google Apps Script web app acting as an ad hoc JSON store layered on a Sheet.
- Writes are chunked over GET requests (~1500 chars per request) to dodge URL length limits, then "committed" with a second request (`app.js:884-905`).
- Reads pull the whole sheet as JSON and the client performs manual 3-way merge logic against `localStorage` and bundled mock data, by Arbor ID/name heuristics (`app.js:814-872`).
- `localStorage` is, in practice, the client's source of truth; the Sheet is a sync target, not a system of record.

### AI usage (existing, unrelated to this migration but relevant to phase 3)
- The app already calls the Anthropic API directly from the browser (`app.js:2557`, `2699`, `3066`), sending full ISP content with no anonymisation.
- The API key is currently embedded in client-side JS (`app.js:4`) — a pre-existing exposure, independent of this migration, flagged in Section 5.

---

## 2. Problems with the Sheets-based approach at scale

| # | Problem | Why it matters |
|---|---|---|
| 1 | No schema/types — content is a stringified JSON blob inside URL params | No server-side validation; malformed writes succeed silently |
| 2 | No concurrency control | Two staff editing the same ISP at once silently overwrite each other |
| 3 | Apps Script execution/URL-fetch quotas | Daily caps; risk of failure under load at high-stakes moments (review deadlines, parents' evenings) |
| 4 | Write endpoint has no real authentication | `doPost`/`doGet` (`index.html:385`) accepts any request holding the exec URL — not a real ACL |
| 5 | No audit trail | No record of who changed what and when — a gap for safeguarding/SEN compliance |
| 6 | Not transactional | Chunk-then-commit write can partially fail mid-sequence, leaving corrupt/partial records with no rollback |
| 7 | Not queryable | Sheets isn't a query engine; all filtering/reporting happens client-side after pulling everything — won't scale and blocks the planned AI reporting feature |
| 8 | Fragile client-side merge logic | The need for manual 3-way merging by name/Arbor ID heuristics is itself evidence the storage layer can't be trusted as canonical |
| 9 | No backup/restore | A Sheet is one accidental bulk delete away from losing every ISP in the trust |

---

## 3. Target architecture

### Core principle: two tables, two access scopes, hard boundary between them

| Table | Purpose | Access granted to app |
|---|---|---|
| `isp_database.isps` (existing, unchanged) | Arbor roster sync, owned by the existing data pipeline | Read-only (`bigquery.readonly` OAuth scope; `roles/bigquery.dataViewer` IAM) |
| `isp_database.isp_records` (new) | Staff-authored ISP content: goals, outcomes, provision, review notes, APDR status | Write access scoped to this table only (`bigquery.insertdata` OAuth scope; `roles/bigquery.dataEditor` IAM bound at table level, not dataset level) |

Rationale: even a fully compromised or buggy write path in the app cannot reach the roster table, because the OAuth token it holds is structurally incapable of granting `DELETE`/`UPDATE`/`DROP` on anything — `bigquery.insertdata` only permits `tabledata.insertAll`. This is enforced by Google's scope model, not by application logic, so it holds even if the app has a bug.

### New table schema: `isp_records`

```
isp_id            STRING     -- primary key (UUID)
arbor_id          STRING     -- FK to roster table; join key, not a duplicated identifier
school            STRING
created_by        STRING     -- staff email
created_at        TIMESTAMP
updated_by        STRING
updated_at        TIMESTAMP
status            STRING     -- active / closed / draft
goals             JSON
outcomes          JSON
provision_notes   JSON
apdr_data         JSON
review_date       DATE
version           INTEGER    -- incremented on every write; basis for optimistic concurrency
```

- Flexible ISP content (goals, outcomes, notes) stays as native BigQuery `JSON` columns rather than being flattened into dozens of typed columns — keeps the shape close to current data while making the governance-relevant metadata (who/when/which school/version) properly typed and queryable.
- `arbor_id` is a join key only. Pupil name, DOB, etc. are never duplicated into this table — always join to the roster table at query time. This keeps the new table's content scope as narrow as possible, even though it remains special-category data by virtue of SEN/EP content.

---

## 4. Implementation steps

**Step 1 — Protect existing roster data (infra-only, no app changes)**
- Create `isp_records` table with the schema above.
- Grant `roles/bigquery.dataEditor` on `isp_records` only, to the relevant principals/service accounts.
- Leave `roles/bigquery.dataViewer` on `isps` (roster) unchanged for the same principals — two distinct IAM bindings, two distinct blast radii.
- Confirm BigQuery time-travel (default 7-day window) is enabled on `isps` as an additional safety net.

**Step 2 — Write path**
- Replace `postToSheet()` with a `postToBigQuery(isp)` using a parameterized streaming insert (`tabledata.insertAll`) or a parameterized `MERGE` query job if true upserts are needed (insertAll alone does not support update-in-place).
- Implement optimistic concurrency: client sends `expected_version`; reject/flag the write if the stored row's version has advanced — surfaces "someone else edited this" instead of a silent overwrite.
- Prefer append-as-new-version over update-in-place where practical — produces a queryable audit trail for free (who changed what outcome, when), addressing the safeguarding gap in Section 2.

**Step 3 — Read path**
- Replace the ISP-content portion of `loadSheetData()` with a query against `isp_records`, joined to the roster table at query time for display. Roster read logic is untouched.
- Once BigQuery is canonical, remove the chunked-GET protocol and the client-side 3-way merge logic entirely.

**Step 4 — Migration & cutover**
- One-off script: export current ISPs from the Sheet/localStorage, write into `isp_records` with `version = 1`, `created_by = 'migration'`.
- Run a parallel write window (write to both Sheets and BigQuery, read from BigQuery, reconcile counts) before fully cutting over.
- Decommission the Apps Script web app and its unauthenticated exec URL once confidence is established.

---

## 5. Pre-existing issue to address alongside this work

The Anthropic API key is currently shipped in client-side JS (`app.js:4`), exposing it to extraction and abuse by anyone who views source. This is independent of the BigQuery migration but should be fixed via a small server-side proxy before any expansion of AI usage (Section 6). Recommend prioritising this fix early in the migration window rather than after.

---

## 6. Phase 3 (later): AI-generated reports with pupil anonymisation

Once `isp_records` is canonical and queryable, AI reporting can be layered on top with the following controls:

1. **Pseudonymise before any API call** — replace pupil name/Arbor ID/UPN with a session-scoped token (e.g. `Student-A1`) when constructing the prompt sent to the Anthropic API, ideally inside the server-side proxy from Section 5 rather than client-side.
2. **Re-identification map stays server-side only** — the token → real-identity mapping is used solely to re-label the AI's output for display, and never leaves the controlled backend.
3. **Strip indirect identifiers, not just direct ones** — in small schools, "the only Year 11 EAL pupil with X" can be identifying even without a name. Per-pupil free-text reports carry materially higher re-identification risk than trust-wide aggregate reports; recommend restricting AI reporting to aggregate/multi-pupil scope initially.
4. **Log every AI report generation** — who requested it, what pseudonymised payload was sent, when. Processing special-category data through a third-party LLM is exactly the kind of activity a DPIA will expect demonstrable controls for.

---

## 7. Suggested sequencing

1. Create `isp_records` table + table-level IAM (Section 4, Step 1) — infra only.
2. Build write path with insert-only scope + optimistic concurrency (Step 2).
3. Build read path + run parallel-write migration window (Steps 3–4).
4. Retire Sheets/Apps Script entirely.
5. Move the Anthropic API key server-side (Section 5) — can run in parallel with 1-4, ideally completed before Section 6 starts.
6. Build anonymised AI reporting on top of the now-canonical BigQuery data (Section 6).
