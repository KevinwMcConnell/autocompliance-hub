

## Clean Up Navigation and First-Use Flow

A focused set of changes to make the workflow obvious: Dashboard -> Upload -> Evidence -> Tasks -> Exports. No schema changes, no logic changes, no routing changes beyond sidebar order.

### Files to modify

1. **`src/components/AppSidebar.tsx`** -- Reorder sidebar nav
2. **`src/pages/Dashboard.tsx`** -- Restructure CTAs and conditionally de-emphasize Export
3. **`src/pages/EvidenceMap.tsx`** -- Improve empty state and descriptive wording
4. **`src/pages/Tasks.tsx`** -- Improve empty state wording
5. **`src/pages/Exports.tsx`** -- Improve empty state and de-emphasize when not ready

---

### 1. Sidebar order (`AppSidebar.tsx`)

Reorder the `navigation` array to match the workflow:

```text
Dashboard  ->  Upload Inbox  ->  Evidence Map  ->  Tasks  ->  Exports  ->  Settings
```

Currently Evidence Map comes before Upload Inbox. Swap them.

---

### 2. Dashboard CTAs (`Dashboard.tsx`)

**Current**: Two equal buttons -- "Upload Documents" (outline) and "Export Packet" (primary). Export feels like a first action.

**Change**:
- Make "Upload Documents" the primary CTA (filled button, listed first).
- Add "View Evidence Map" as a secondary outline button.
- Show "Export Packet" only when there are approved evidence items (`okEvidence > 0`). When no approved evidence exists, omit the Export button entirely from the header.
- Remove the duplicate "Quick Upload" dashed card in the middle row -- it competes with the header CTA and the Upload Inbox page. Replace it with a simple info card that says "Next step: Upload your compliance documents to get started" when there are zero documents, or show due-soon summary when data exists.

---

### 3. Evidence Map wording (`EvidenceMap.tsx`)

**Empty state**: Change subtitle from "Track all compliance documents and their status" to "Track required compliance items and attach uploaded documents to them."

**"Add Evidence Item" button**: Change label to "Add Compliance Requirement" so first-time users understand they are creating a requirement to track, not uploading a file.

**Empty state body**: Change from "Upload compliance documents or create an evidence item to start tracking your requirements" to:
- Primary CTA: "Upload Documents" (links to Upload Inbox)
- Secondary CTA: "Add Compliance Requirement" -- with helper text: "Create a compliance requirement to track, then attach uploaded documents to it."

---

### 4. Tasks empty state (`Tasks.tsx`)

**Change** the empty state copy from "Add a task to start tracking your compliance requirements" to "Create tasks for compliance work that needs to get done -- inspections, renewals, follow-ups."

Button text stays "Add Your First Task".

---

### 5. Exports page (`Exports.tsx`)

**When evidence items exist but none are "ok"**: Currently shows the full export UI with 0 items selected and the export button disabled. Add a prominent banner at the top explaining: "Your inspection packet isn't ready yet. Upload and approve documents, then attach them to evidence items to include them in your export."

**Empty state** (no evidence items): Already good -- links to Upload Inbox. No change needed.

---

### Summary of improvements

- **Sidebar order** matches real workflow (Upload before Evidence).
- **Dashboard** makes Upload the obvious first action; Export is hidden until relevant.
- **Duplicate upload card** on Dashboard replaced with contextual guidance.
- **Evidence Map** clarifies the distinction between uploading a file vs. creating a requirement.
- **Tasks** has clearer empty-state guidance.
- **Exports** explains why it's not ready when no approved evidence exists.
- Zero functionality removed. Zero schema changes. Zero routing changes.

