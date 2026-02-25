

## Fix: File Picker Not Opening on Android Tablet

### Root Cause

Two issues are likely preventing the file picker from opening on Android tablets:

1. **`useId()` generates IDs with colons** (e.g., `:r1:`). While valid HTML, Android Chrome has known issues matching `htmlFor` to `id` attributes containing special characters, so the label-to-input association silently fails.

2. **Radix Dialog focus trap** can intercept tap events before they propagate to the label, preventing the native label activation from reaching the hidden input.

### Solution

A two-part fix that ensures taps always reach the file input directly:

1. **Replace `useId()` with a stable plain-string ID** -- use `"upload-dialog-file-input"` (no colons or special characters) so `htmlFor`/`id` matching works reliably on all browsers.

2. **Overlay the input on top of the dropzone** -- instead of hiding the input with `sr-only` (which clips it to 1x1px), position it as `absolute inset-0 opacity-0` covering the entire dropzone area. This way, taps physically land on the `<input type="file">` element itself, completely bypassing any label association or focus trap issues. The input remains invisible but receives touch events directly.

### Technical Changes

**File: `src/components/UploadDialog.tsx`**

- Remove `useId` import
- Replace `const inputId = useId()` with `const inputId = "upload-dialog-file-input"`
- Change the input's className from `"sr-only"` to `"absolute inset-0 opacity-0 cursor-pointer"` and add `style={{ fontSize: "16px" }}` (prevents iOS zoom on focus)
- Add a `z-10` to the input so it sits above the visual content inside the label
- Keep everything else (label wrapper, onChange handler, accept attribute, drag-and-drop) unchanged

This approach is the most reliable for mobile because the browser does not need to resolve any `htmlFor` association -- the user's finger literally touches the file input element.

