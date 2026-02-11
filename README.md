# Paste Libre

A Chrome extension that restores copy, cut, and paste on websites that block clipboard access.

## The Problem

Many corporate portals, news sites, and web applications use JavaScript to block your clipboard. They prevent you from copying text, pasting content, or even selecting text on the page. Some use enterprise DLP (Data Loss Prevention) systems like Microsoft Defender for Cloud Apps that inject scripts into pages to hijack your clipboard events and show "Action blocked" popups.

Existing extensions don't work against these systems because they only try to block event listeners. The DLP scripts are more sophisticated than that.

## How It Works

Paste Libre takes a fundamentally different approach. Instead of trying to block DLP event listeners (which the DLP scripts can work around), it **lets all event listeners run normally** but makes `preventDefault()` and `stopPropagation()` silently do nothing when called on clipboard events.

This means:
- The web app's own copy/paste logic still works perfectly
- DLP scripts *think* they blocked the clipboard action, but they didn't
- No detectable interference with page functionality

Specifically, Paste Libre:

1. **Neuters clipboard event blocking** - `preventDefault()`, `stopPropagation()`, and `stopImmediatePropagation()` become no-ops for `ClipboardEvent`s
2. **Blocks `oncopy`/`oncut`/`onpaste` property hijacking** - prevents scripts from setting these handler properties
3. **Protects the Clipboard API** - freezes `navigator.clipboard` methods so they can't be overridden
4. **Auto-removes "Action Blocked" popups** - detects and dismisses DLP modal dialogs
5. **Forces text selection** - overrides `user-select: none` CSS

## Tested Against

- Microsoft Defender for Cloud Apps (MCAS/CASB)
- Microsoft 365 Outlook Web (`.mcas.ms` proxy)
- Microsoft Teams Web
- Generic `oncopy="return false"` sites
- Sites using `user-select: none` CSS
- Sites blocking right-click context menu on text

## Install from Source

1. Clone this repo or download the ZIP
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the extension folder

## Install from Chrome Web Store

Coming soon.

## Privacy

Paste Libre:
- Requires **no special permissions** beyond running on web pages
- Collects **zero data**
- Makes **no network requests**
- Has **no analytics or telemetry**
- Runs entirely client-side in your browser

## License

MIT
