
# Stabilize UploadDialog File Picker + Diagnostics

## Summary

Fix the dual event handler conflict causing the file picker to not open reliably on laptop/tablet, add a visible "Choose files" button, remove the `key` remount trick, and add debug logging with specific error toasts.

## Changes (single file: `src/components/UploadDialog.tsx`)

### 1. Remove dual event handler conflict

The component currently has BOTH:
- React synthetic `handleFileInput` function (lines 206-236) -- unused on the `<input>` element but defined
- Native `addEventListener("change"/"input")` in a `useEffect` (lines 238-270)

The `<input>` element at line 491 does NOT have `onChange`/`onInput` props, so the React handler `handleFileInput` is dead code. However, the native `useEffect` attaches listeners to both `"change"` AND `"input"` events with `{ capture: true }`, which can cause double-firing.

**Fix:**
- Delete the unused `handleFileInput` callback entirely (lines 206-236)
- In the native `useEffect`, listen to `"change"` only (remove the `"input"` listener) -- this eliminates double-fire risk
- This gives us exactly ONE handler path

### 2. Remove `key={open ? "open" : "closed"}` from the input

Line 498 forces React to destroy and recreate the input DOM node every time the dialog opens/closes. This can race with the `useEffect` that attaches native listeners (the ref becomes stale). The "same file twice" fix is already handled by resetting `input.value = ""` before opening and after selection.

**Fix:** Remove the `key` prop from the `<input>`.

### 3. Add a visible "Choose files" button

The current dropzone `div` with `role="button"` relies on the entire area being clickable, which some browsers/gesture handlers may not treat as a real button click. Add a proper `<Button type="button">` inside the dropzone that calls `openFilePicker` directly.

```tsx
<Button
  type="button"
  variant="outline"
  size="sm"
  onClick={(e) => {
    e.stopPropagation();
    openFilePicker();
  }}
  disabled={isUploading}
  className="mt-2"
>
  <Upload className="h-4 w-4 mr-2" />
  Choose files
</Button>
```

This sits inside the dropzone area, below the existing text. The dropzone `div` keeps drag-and-drop support but the button provides a reliable click target.

### 4. Add debug logging

**Picker open log** -- in `openFilePicker`:
```typescript
console.log("[UploadDialog] Opening picker:", {
  facilityId, evidenceItemId, accept: ACCEPT_ATTRIBUTE, multiple: true
});
```

**Upload start log** -- at the top of `uploadFile`, after computing `storagePath`:
```typescript
console.log("[Upload] Starting:", {
  facilityId, evidenceItemId: evidenceItemId || "(none)",
  storagePath, fileName: file.name, fileSize: file.size, fileType: file.type
});
```

### 5. Specific error toasts

Replace the generic `throw uploadError` / `throw insertError` with specific toasts before throwing:

- Storage error: `toast.error(\`Storage upload failed: ${uploadError.message}\`)`
- DB insert error: `toast.error(\`Database insert failed: ${insertError.message}\`)`

### 6. Zero files selected toast

In the native change handler, when `selectedFiles.length === 0`, add:
```typescript
console.log("[UploadDialog] Picker returned 0 files (cancelled or empty)");
```
(Not a toast -- returning 0 files usually means the user cancelled the picker, which is normal behavior.)

## What stays the same

- Synchronous `fileInputRef.current?.click()` in `openFilePicker` (no setTimeout)
- `onPointerDown`/`onMouseDown`/`onTouchStart` reset handlers on the dropzone div
- Off-screen positioning of the input (not display:none)
- `resetFileInput()` before picker and `input.value = ""` after selection
- `resetState()` on dialog close (abort + clear)
- All upload logic, approval flow, drag-and-drop

## Technical Detail: Exact Edits

| Lines | Action |
|-------|--------|
| 206-236 | Delete `handleFileInput` callback (dead code) |
| 264-265 | Remove `"input"` listener, keep only `"change"` |
| 267-268 | Remove `"input"` removeEventListener |
| 273-277 | Add debug log in `openFilePicker` |
| 289-291 | Add debug log at upload start |
| 298-306 | Add specific storage error toast before throw |
| 340 | Add specific DB error toast before throw |
| 498 | Remove `key={open ? "open" : "closed"}` |
| 546-553 | Add "Choose files" Button below existing text |
