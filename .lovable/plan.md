

## Add Delete Buttons to Upload Inbox Documents

The Upload Inbox page currently has no way to delete documents from either the "Needs Review" or "Processed" tabs. The Evidence Map already has full delete functionality that we can follow as a pattern.

### Changes

**File: `src/pages/UploadInbox.tsx`**

1. **Add `storage_path` to the Document interface** -- needed to delete files from storage.

2. **Add state variables** for delete flow:
   - `documentToDelete` (Document or null)
   - `isDeleting` (boolean)

3. **Add `handleDeleteDocument` function** that:
   - Deletes the file from the `compliance-documents` storage bucket using `storage_path`
   - Deletes the database record from `documents` table
   - Recomputes linked evidence item status if the doc was linked
   - Refreshes the document list

4. **Add a Delete button (trash icon) to each document card** in both tabs:
   - "Needs Review" tab: add a Trash2 icon button next to the Approve button
   - "Processed" tab: add a Trash2 icon button in the card's action area

5. **Add an AlertDialog for delete confirmation** -- matching the pattern used in Evidence Map, asking "Are you sure?" before permanently deleting.

6. **Add imports**: `Trash2` from lucide-react, `AlertDialog` components from the UI library.

### Technical Details

- The delete function follows the same two-step pattern from Evidence Map: delete from storage first, then delete the DB record
- If the document has an `evidence_item_id`, the linked evidence item's status will be recomputed after deletion (fetch all remaining docs for that item, recalculate status/dates)
- The confirmation dialog prevents accidental deletions
- No database migrations needed -- all tables and policies already exist

