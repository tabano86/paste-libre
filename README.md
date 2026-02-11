# Clipboard Unlock

Chrome extension that restores copy, cut, and paste on websites that block clipboard access. Works against corporate DLP systems like Microsoft Defender for Cloud Apps (MCAS/CASB), Outlook Web, Teams, and any site that disables clipboard functionality.

## Install

### Clone and load manually

```bash
git clone https://github.com/tabano86/clipboard-unlock.git
```

1. Open `chrome://extensions/` in Chrome
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `clipboard-unlock` folder you just cloned

### Chrome Web Store

Coming soon.

## How it works

Instead of blocking DLP event listeners (which DLP scripts can work around), Clipboard Unlock lets all event listeners run normally but makes `preventDefault()` and `stopPropagation()` do nothing on clipboard events. The web app works fine, DLP scripts *think* they blocked you, but they didn't.

## Privacy

Zero data collection. Zero network requests. No analytics. No telemetry. Runs entirely in your browser.

## License

MIT
