
I checked the current `src/components/UploadDialog.tsx` and the requested two changes are well scoped.

What’s going on
- The current implementation already moved the file input outside the dialog and made it invisible-but-rendered, which is the right general direction for Android.
- But it still relies on `window.focus` to detect picker return. On some Android/tablet browsers, the file picker lifecycle does not reliably restore focus in a way that triggers this handler.
- That means the picker may open, but the selected file never gets processed into the queue.
- Your requested replacement to `visibilitychange` is a sensible next step because mobile browsers often toggle document visibility when the native picker opens/closes, even when focus behavior is inconsistent.

Planned changes
1. Update the hidden file input style only
   - Replace the current invisible absolute style:
     ```ts
     style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none', top: 0, left: 0 }}
     ```
   - With the exact off-screen fixed style you provided:
     ```ts
     style={{ position: 'fixed', top: '-100px', left: '-100px', width: '1px', height: '1px', opacity: 0 }}
     ```
   - This keeps the input rendered in the DOM while avoiding some browser quirks around zero-visibility clickable targets.

2. Replace the picker return detection effect exactly as requested
   - Remove the entire current `useEffect` that attaches:
     ```ts
     window.addEventListener("focus", handleWindowFocus)
     ```
   - Replace it with your `visibilitychange`-based effect exactly.
   - This will:
     - wait until the document becomes visible again
     - confirm the picker was actually opened via `pickerOpenRef`
     - check whether files exist on the input
     - pass the input back into existing `processPickedFiles(...)`
   - No other logic or state needs to change.

Why this is likely the right next fix
- The current failure is most likely in the “picker returned but event recovery never ran” path, not in the queueing logic itself.
- `processPickedFiles`, dedupe handling, `onChange`, `onInput`, and queue insertion all look intact from the current file.
- So changing the hidden input positioning plus using `visibilitychange` targets the two places most likely to differ across Android Chrome / Samsung Browser / tablet webviews.

Technical notes
- I would not change:
  - the synchronous `fileInputRef.current?.click()`
  - `pickerOpenRef.current = true`
  - `onChange` / `onInput`
  - queueing logic
  - dialog structure
- The current file order is also important: `processPickedFiles` is declared before the effect, so replacing the effect should not reintroduce the earlier runtime initialization bug.

Expected result after implementation
- Input remains invisible but still mounted in the DOM
- Android browsers have a better chance of both opening the picker and processing the selected file
- Desktop click-to-upload should remain unchanged
- Drag-and-drop remains unchanged

Limits / reality check
- If this still fails specifically inside an embedded preview/webview, the problem may be browser-container restrictions rather than React logic.
- The best signal will be testing in the standalone preview URL in Android Chrome or Samsung Browser, not the in-app preview container.

Implementation scope
- Exactly 2 code edits in `src/components/UploadDialog.tsx`
- No refactor
- No state changes
- No extra UI changes
- No backend changes
