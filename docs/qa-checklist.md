# QA Checklist

Use this checklist before releasing updates to the HTML toolset. Tick every item for each page that changes.

## Automated
- [ ] `npm test` passes locally (unit + integration suites).
- [ ] Coverage thresholds (80/70/80/80) are met or exceeded.
- [ ] Review GitHub Actions run for the branch — ensure all jobs are green.

## Accessibility & UX
- [ ] Pages load without console errors in Chrome, Firefox, and Safari.
- [ ] Critical interactions are operable via keyboard only (tab navigation, button activation).
- [ ] High-contrast mode/theme variations remain legible.
- [ ] Clipboard interactions (copy/paste buttons) behave as expected with permission prompts handled gracefully.

## Functional validation
- [ ] Title case converter updates output immediately and reflects the latest timestamp.
- [ ] AI virtual browser mock loads the iframe, updates the status bar on navigation, and appends AI responses without layout shift.
- [ ] Clear/reset actions leave components in a predictable default state.

## Regression smoke tests
- [ ] Validate that URLs without protocol are automatically prefixed with `https://` in the virtual browser tool.
- [ ] Confirm debounced inputs do not trigger redundant updates under rapid typing.
- [ ] Verify responsive layout on viewports 375px, 768px, and 1280px.

## Release hygiene
- [ ] Update `docs/testing-strategy.md` if the scope of automation changes (new suites, additional thresholds, tooling updates).
- [ ] Update this checklist when new tools or features are added so manual QA remains aligned.
