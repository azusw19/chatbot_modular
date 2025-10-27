# Test Scenarios (manual)

## Interaction
- Open via launcher → panel animates in, focus on textarea.
- Send message "Hello" → user bubble appears; typing indicator visible; then bot response replaces indicator.
- Close while pending → request aborted, no console errors.

## Errors
- With invalid webhook, response shows friendly network error and status text updates to "Greška mreže".

## A11y
- Tab cycles between textarea and send button.
- Esc closes and returns focus to launcher.
- Screenreader announces "Korisnik kaže:" then "Bot kaže:".

## Performance
- Paste and send 10 quick messages; scroll stays at bottom; no jank or layout thrash.
