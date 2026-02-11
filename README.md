# Clipboard Unlock

Chrome extension that restores default browser clipboard behavior on websites that override copy, cut, and paste functionality.

## Disclaimer

THIS SOFTWARE IS PROVIDED FOR EDUCATIONAL AND PERSONAL USE ONLY.

The authors and contributors of this project are **not responsible** for how this software is used. By using this extension, you acknowledge and agree that:

- **You are solely responsible** for ensuring your use complies with all applicable laws, regulations, employer policies, and terms of service.
- This extension is provided **"as is"** with absolutely **no warranty**, express or implied.
- The authors accept **no liability** for any damages, consequences, disciplinary actions, or legal claims arising from the use or misuse of this software.
- This project is **not affiliated with, endorsed by, or associated with** Microsoft, Google, or any other company.
- Users should **consult their organization's IT policies** before using this extension on managed or corporate accounts.

Use at your own risk.

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

Some websites override default browser clipboard events using JavaScript. This extension preserves the browser's native clipboard behavior by ensuring standard event handling is not suppressed by third-party page scripts.

## Privacy

Zero data collection. Zero network requests. No analytics. No telemetry. Runs entirely in your browser.

## License

MIT - See [LICENSE](LICENSE) for full text.
