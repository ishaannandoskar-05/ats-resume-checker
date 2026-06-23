# ATS Resume Checker - Bug Report

After reviewing the initial implementation of the ATS Resume Checker, I have identified several bugs and missing functionalities that need to be addressed:

## 1. Drag-and-Drop Functionality is Missing
**Severity**: High
**Description**: The file upload UI is styled as a "drop zone" and includes the text "Drop your resume here", but the `App.jsx` component only implements an `onChange` handler on the hidden file input. 
**Impact**: If a user drags and drops a file onto the zone, the browser will execute its default behavior (opening the PDF/DOCX in the current tab), navigating the user away from the application and losing their state.
**Fix**: Add `onDrop`, `onDragOver`, and `onDragLeave` event handlers to the `<label>` or its container. Use `e.preventDefault()` to stop the browser's default behavior, and extract the file using `e.dataTransfer.files[0]`.

## 2. PDF.js Data Type and Worker Version Compatibility
**Severity**: Medium
**Description**: There are two potential issues with how `pdfjs-dist` is implemented:
1. `pdfjsLib.getDocument({ data: arrayBuffer })` passes a raw `ArrayBuffer`. In modern versions of `pdfjs-dist` (v3+), the `data` parameter often strictly expects a `Uint8Array` or a typed array. 
2. The worker source is loaded via a CDN using `pdfjsLib.version`. In the newest versions of `pdfjs-dist`, this property might be structured differently, or the exact version might not be immediately available on the specified CDN, causing PDF parsing to crash.
**Fix**: 
- Convert the ArrayBuffer: `data: new Uint8Array(arrayBuffer)`.
- Use a local worker import if possible, or ensure the CDN version is hardcoded to a stable release that matches the installed package.

## 3. Empty File / Image-based PDF Silent Failure
**Severity**: Medium
**Description**: If a user uploads an image-based PDF (a scanned resume without OCR), `pdfjs-dist` will extract 0 characters of text. The `resumeText` state will be empty, and the UI will either not show the "Analyze" button, or if it does, it will send an empty string to the backend which will cause poor AI results or an API error.
**Fix**: Add a validation check after parsing: `if (fullText.trim().length === 0) { alert('No text could be extracted. Please ensure your PDF is not an image/scan.'); }`.

## 4. UI Freezes During Large File Parsing
**Severity**: Low
**Description**: Extracting text from a large, multi-page PDF or a complex DOCX file can take a noticeable amount of time. Currently, this process happens synchronously-ish in the main thread (awaiting promises in a loop), without updating the UI to a "Reading file..." state. 
**Impact**: The app may appear frozen for a few seconds before the "Analyze Resume" button appears.
**Fix**: Introduce a new state `setParsingStatus('loading')` before parsing starts and clear it after text is extracted, rendering a loading spinner in the UI during this time.

## 5. Potential Markdown Parsing Error in Backend
**Severity**: Low
**Description**: In `app.py`, the code strips ````json`` fences using `split("```json")[1].split("```")[0]`. If Claude outputs valid JSON *without* markdown fences, but the text accidentally includes ```` ` elsewhere, this parsing logic could throw an `IndexError`.
**Fix**: Use robust regex to extract JSON blocks, or simply attempt `json.loads(response_text)` first, and only fall back to stripping markdown fences if it raises a `json.decoder.JSONDecodeError`.
