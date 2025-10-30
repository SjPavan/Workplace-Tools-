import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const htmlPath = resolve(__dirname, '../../title_case_converter_single_file_html.html');
const html = readFileSync(htmlPath, 'utf-8');

describe('Title Case Converter HTML', () => {
  it('auto-converts user input into title case', async () => {
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://example.com',
      pretendToBeVisual: true,
      beforeParse(window) {
        window.navigator.clipboard = {
          async writeText() {
            return undefined;
          },
          async readText() {
            return '';
          }
        };
      }
    });

    const { window } = dom;
    // Wait for any pending microtasks and the initial debounce timer
    await new Promise(resolve => window.setTimeout(resolve, 0));

    const input = window.document.getElementById('input');
    const output = window.document.getElementById('output');

    input.value = 'custom title-case test';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));

    await new Promise(resolve => window.setTimeout(resolve, 250));

    expect(output.textContent).toBe('Custom Title-Case Test');
    const status = window.document.getElementById('status').textContent;
    expect(status.startsWith('Converted automatically')).toBe(true);

    dom.window.close();
  });
});
