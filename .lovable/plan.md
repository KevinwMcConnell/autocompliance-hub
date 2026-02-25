

## Fix: Android Tablet File Picker -- Nuclear Option

### Root Cause (confirmed after 4 attempts)

Radix Dialog's internal `FocusScope` component adds **capture-phase** `pointerdown` listeners that call `event.preventDefault()`. This kills the native file picker activation on Android Chrome touch events. Desktop browsers are unaffected because they handle click-to-file-picker differently.

Our previous fixes (stopPropagation, overlay input, stable IDs) all operate in the **bubble phase**, which runs AFTER Radix's capture-phase handler has already called `preventDefault()`.

### Solution: Three-layer defense

**Layer 1: Disable Radix's auto-focus grab**
Pass `onOpenAutoFocus={(e) => e.preventDefault()}` to `DialogContent` in UploadDialog. This stops Radix from aggressively managing focus when the dialog opens.

**Layer 2: Capture-phase interception**
Add `onPointerDownCapture` on the dropzone `<label>` that calls `e.stopPropagation()`. Since capture phase runs top-down, our handler on the label fires BEFORE Radix's handler on the FocusScope parent, preventing Radix from calling `preventDefault()`.

**Layer 3: Touch-event fallback**
Add an `onTouchEnd` handler on the file input that programmatically calls `this.click()` synchronously. `touchend` is considered a valid user gesture by Android Chrome, so even if pointerdown was blocked, the file picker will open on touch release.

### Technical Changes

**File: `src/components/UploadDialog.tsx`**

1. On `<DialogContent>`, add:
   ```
   onOpenAutoFocus={(e) => e.preventDefault()}
   ```

2. On the `<label>` dropzone wrapper, add capture-phase handler:
   ```
   onPointerDownCapture={(e) => {
     const target = e.target as HTMLElement;
     if (target.tagName === 'INPUT' && target.getAttribute('type') === 'file') {
       e.stopPropagation();
     }
   }}
   ```

3. On the `<input type="file">`, add touchend fallback:
   ```
   onTouchEnd={(e) => {
     e.stopPropagation();
     const input = e.currentTarget;
     // Small delay to let touchend complete, still within gesture window
     requestAnimationFrame(() => input.click());
   }}
   ```

4. Keep all existing handlers (onChange, onPointerDown stopPropagation, etc.) as additional safety.

### Why this will work

- Layer 2 intercepts the event BEFORE Radix can touch it (capture phase beats bubble phase)
- Layer 3 provides a completely independent activation path via touch events
- Layer 1 prevents Radix from stealing focus on dialog open, which can interfere with subsequent interactions
- All three layers are safe no-ops on desktop, so laptop behavior is unchanged

