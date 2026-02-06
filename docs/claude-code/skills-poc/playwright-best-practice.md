```file:./SKILL.md
---
name: playwright-best-practices
description: Playwright automation best practices for web scraping and testing. Use when writing or reviewing Playwright code, especially for element operations (click, fill, select), waiting strategies (waitForSelector, waitForURL, waitForLoadState), navigation patterns, and locator usage. Apply when encountering unstable tests, race conditions, or needing guidance on avoiding deprecated patterns like waitForNavigation or networkidle.
---

# Playwright Best Practices

## Overview

This skill provides guidance on writing reliable, maintainable Playwright automation code based on official best practices. It covers element operations, waiting strategies, navigation patterns, and common anti-patterns to avoid.

## Core Principles

### 1. Always Use Locators with Auto-waiting

Playwright Locators automatically wait and retry until elements are actionable:

```typescript
// ✅ Recommended: Locator with auto-waiting
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Username').fill('john');

// ❌ Avoid: Direct DOM manipulation
await page.evaluate(() => document.querySelector('button').click());
```

### 2. Prefer User-Facing Attributes

Prioritize locators based on how users perceive the page:

```typescript
// Priority order:
// 1. Role-based (best for accessibility)
await page.getByRole('button', { name: 'Sign in' });

// 2. Label-based (best for forms)
await page.getByLabel('Email address');

// 3. Text-based
await page.getByText('Submit');

// 4. Test ID
await page.getByTestId('submit-button');

// 5. CSS/XPath (last resort)
await page.locator('.btn-primary');
```

### 3. Trust Auto-waiting, Minimize Explicit Waits

Locators automatically check actionability before operations:

```typescript
// ✅ Recommended: Action includes waiting
await page.getByRole('button').click();

// ⚠️ Usually unnecessary
await page.waitForSelector('button');
await page.locator('button').click();
```

## Common Workflows

### Element Operations

**Click:**
```typescript
await page.getByRole('button', { name: 'Next' }).click();
```

**Fill text:**
```typescript
await page.getByLabel('Email').fill('user@example.com');
```

**Select option:**
```typescript
await page.getByLabel('Country').selectOption({ label: 'Japan' });
```

**Check/uncheck:**
```typescript
await page.getByLabel('I agree').check();
```

### Navigation Patterns

**Same-page navigation:**
```typescript
// ✅ Recommended: Click and wait for next page element
await page.getByRole('link', { name: 'Next' }).click();
await page.waitForSelector('#next-page-element', { timeout: 30 * 1000 }); // example wait time

// Or use conditional selector for different destination pages
const waitSelector = condition === 'A'
  ? '#page-a-element'
  : '#page-b-element';
await page.waitForSelector(waitSelector, { timeout: 30 * 1000 }); // example wait time
```

**New tab/window:**
```typescript
const [newPage] = await Promise.all([
  page.context().waitForEvent('page'),
  page.getByRole('link', { name: 'Open in new tab' }).click()
]);
await newPage.waitForLoadState();
```

### Form Interactions

```typescript
// Complete form workflow
await page.getByLabel('Username').fill('john');
await page.getByLabel('Password').fill('secret');
await page.getByRole('checkbox', { name: 'Remember me' }).check();
await page.getByLabel('Country').selectOption('Japan');
await page.getByRole('button', { name: 'Submit' }).click();

// Verify submission
await expect(page.getByText('Success')).toBeVisible();
```

## Anti-Patterns to Avoid

### ❌ waitForNavigation (Deprecated)
```typescript
// ❌ Avoid: Deprecated API
const navigationPromise = page.waitForNavigation();
await page.click('button');
await navigationPromise;

// ✅ Use instead: waitForURL or waitForSelector
await page.click('button');
await page.waitForURL('**/next-page');
// or
await page.waitForSelector('#next-page-element');
```

### ❌ networkidle (Unreliable)
```typescript
// ❌ Avoid: Can complete before page is ready
await page.waitForLoadState('networkidle');

// ✅ Use instead: Wait for specific elements
await page.waitForSelector('#content-loaded');
// or
await page.waitForLoadState('load');
```

### ❌ page.evaluate() for Clicks
```typescript
// ❌ Avoid: Bypasses actionability checks
await page.evaluate(() => document.querySelector('button').click());

// ✅ Use instead: Locator click
await page.locator('button').click();
```

### ❌ Unnecessary Promise.all
```typescript
// ❌ Unnecessary: Playwright auto-waits for navigation
await Promise.all([
  page.waitForNavigation(),
  page.click('button')
]);

// ✅ Simpler: Just click
await page.click('button');
```

## Actionability Checks

Playwright automatically verifies these conditions before actions:

| Action | Visible | Stable | Receives Events | Enabled | Editable |
|--------|---------|--------|----------------|---------|----------|
| click() | ✓ | ✓ | ✓ | ✓ | - |
| fill() | ✓ | - | - | ✓ | ✓ |
| check() | ✓ | ✓ | ✓ | ✓ | - |
| selectOption() | ✓ | - | - | ✓ | - |
| hover() | ✓ | ✓ | ✓ | - | - |

**Definitions:**
- **Visible**: Has bounding box, not `visibility:hidden`
- **Stable**: Same position for 2+ frames (animation complete)
- **Receives Events**: Not covered by other elements
- **Enabled**: No `disabled` attribute
- **Editable**: Enabled and not `readonly`

## When to Use Explicit Waits

Explicit waits are needed in these cases:

```typescript
// 1. Before using locator.all() (doesn't auto-wait)
await page.getByRole('listitem').first().waitFor();
const items = await page.getByRole('listitem').all();

// 2. Waiting for element to disappear
await page.locator('.loading').waitFor({ state: 'hidden' });

// 3. Waiting for element to detach
await page.locator('.modal').waitFor({ state: 'detached' });

// 4. Conditional page destinations
const waitSelector = condition ? '#page-a' : '#page-b';
await page.waitForSelector(waitSelector, { timeout: 30 * 1000 }); // example wait time
```

## Advanced References

For detailed information on specific topics, see:

- **[anti-patterns.md](references/anti-patterns.md)**: Detailed explanation of deprecated patterns and why to avoid them
- **[locators.md](references/locators.md)**: Comprehensive guide to locator strategies and selection
- **[actions.md](references/actions.md)**: Detailed action methods and their behavior
- **[navigation.md](references/navigation.md)**: Advanced navigation patterns and edge cases

## Official Documentation

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Actionability](https://playwright.dev/docs/actionability)
- [Locators](https://playwright.dev/docs/locators)
- [Navigations](https://playwright.dev/docs/navigations)
```

```file:./gpt.sh
#!/bin/bash

# 設定部分 - これらの配列を変更するだけで除外設定が可能
# 除外するディレクトリの配列(パターンマッチ用)
EXCLUDED_DIRS=("node_modules" ".next" ".git" ".wrangler" "dist")
# 除外するファイルの配列(パターンマッチ用)
EXCLUDED_FILES=(".env*" "*.lock" "pnpm-lock.yaml" ".dev.vars" "package-lock.json")
# 最大ファイルサイズ(バイト単位)
MAX_FILE_SIZE=10240

# バイナリファイルかどうかを判定する関数
is_binary_file() {
  local file="$1"
  local file_output
  file_output=$(file "$file")
  
  if [[ "$file_output" == *"text"* ]]; then
    return 1  # テキストファイルの場合
  else
    return 0  # バイナリファイルの場合
  fi
}

# ファイルが除外リストに含まれているかをチェックする関数
is_excluded_file() {
  local file="$1"
  local basename=$(basename "$file")
  
  for pattern in "${EXCLUDED_FILES[@]}"; do
    if [[ "$basename" == $pattern ]]; then
      return 0  # 除外対象
    fi
  done
  
  return 1  # 除外対象ではない
}

# メイン処理
main() {
  # フォルダ名の取得
  folder_name=$(basename "$PWD")
  # 出力ファイル名を設定
  output_file="${folder_name}.md"
  # 出力ファイルを新規作成または上書き
  > "$output_file"

  # find コマンドのためのディレクトリ除外パターンを構築
  dir_exclude_pattern=""
  for dir in "${EXCLUDED_DIRS[@]}"; do
    dir_exclude_pattern+=" -o -name \"$dir\""
  done
  # 先頭の " -o " を削除
  dir_exclude_pattern=${dir_exclude_pattern:4}

  # find コマンドの出力を取得し、ファイルに保存
  echo "## Find Output" | tee -a "$output_file"
  find_cmd="find . -type d \( $dir_exclude_pattern \) -prune -o -type f -print"
  eval "$find_cmd" | xargs ls -lh | tee -a "$output_file"

  # ソースコードセクションの開始
  echo "## Source Code" | tee -a "$output_file"

  # find コマンドを使用して除外条件を含むファイルリストを取得
  find_output=$(eval "$find_cmd")
  
  while IFS= read -r line; do
    # 出力ファイル自体は処理しない
    if [[ "$line" == "./$output_file" ]]; then
      echo "Ignored (output file): $line"
      continue
    fi
    
    # 除外パターンに一致するファイルはスキップ
    if is_excluded_file "$line"; then
      echo "Ignored (excluded file): $line"
      continue
    fi
    
    # バイナリファイルはスキップ
    if is_binary_file "$line"; then
      echo "Ignored (binary file): $line"
      continue
    fi
    
    # ファイルサイズをチェック
    file_size=$(stat -c%s "$line")
    if (( file_size > MAX_FILE_SIZE )); then
      echo "Ignored (file too large): $line"
      continue
    fi
    
    # ファイルの内容を出力
    {
      echo "\`\`\`file:$line"
      cat "$line"
      echo "\`\`\`"
      echo
    } | tee -a "$output_file"
    echo "Processed: $line"
  done <<< "$find_output"

  # 出力ファイルサイズのセクション
  output_file_size=$(stat -c%s "$output_file")
  echo "## Output File Size" | tee -a "$output_file"
  echo "Output file size: $output_file_size bytes" | tee -a "$output_file"
}

# スクリプトを実行
main```

```file:./references/locators.md
# Locator Strategies

Comprehensive guide to locator strategies and selection.

## Locator Priority Order

Choose locators in this priority order to maximize test resilience:

### 1. Role-based (Highest Priority)

Best for accessibility and semantic meaning.

```typescript
// ✅ Buttons
await page.getByRole('button', { name: 'Submit' });
await page.getByRole('button', { name: /submit/i }); // Case-insensitive regex

// ✅ Links
await page.getByRole('link', { name: 'Home' });

// ✅ Form controls
await page.getByRole('textbox', { name: 'Username' });
await page.getByRole('checkbox', { name: 'Remember me' });
await page.getByRole('radio', { name: 'Option A' });

// ✅ Headings
await page.getByRole('heading', { name: 'Welcome' });
await page.getByRole('heading', { level: 1 }); // <h1>

// ✅ Lists
await page.getByRole('listitem').filter({ hasText: 'Item 2' });
```

**Common roles:**
- `button`, `link`, `textbox`, `checkbox`, `radio`, `combobox`
- `heading`, `listitem`, `row`, `cell`, `tab`, `dialog`
- See [ARIA roles reference](https://www.w3.org/TR/wai-aria-1.2/#role_definitions)

### 2. Label-based (Form Elements)

Best for form inputs with associated labels.

```typescript
// ✅ Input fields
await page.getByLabel('Email address');
await page.getByLabel('Password');
await page.getByLabel(/username/i); // Case-insensitive

// ✅ Checkboxes
await page.getByLabel('I agree to terms');

// ✅ Selects
await page.getByLabel('Country');
```

**How it works:** Matches via `<label for="id">`, wrapping labels, or `aria-labelledby`.

### 3. Placeholder-based

For inputs without visible labels.

```typescript
// ✅ When label isn't visible
await page.getByPlaceholder('name@example.com');
await page.getByPlaceholder('Search...');
```

### 4. Text-based

For elements with visible text content.

```typescript
// ✅ Exact match
await page.getByText('Submit');

// ✅ Substring match
await page.getByText('Sub', { exact: false });

// ✅ Regex match
await page.getByText(/submit/i);

// ✅ With element type
await page.locator('button', { hasText: 'Submit' });
```

### 5. Alt text (Images)

For images and area elements.

```typescript
// ✅ Images
await page.getByAltText('Company logo');
await page.getByAltText(/logo/i);
```

### 6. Title attribute

For elements with title attributes.

```typescript
// ✅ Tooltip or title
await page.getByTitle('Close dialog');
```

### 7. Test ID (data-testid)

For stable test-specific attributes.

```typescript
// ✅ Custom test IDs
await page.getByTestId('submit-button');
await page.getByTestId('user-profile');

// Configure custom attribute in playwright.config.ts
use: {
  testIdAttribute: 'data-test-id' // or 'data-qa', etc.
}
```

**When to use:** When semantic attributes aren't available or change frequently.

### 8. CSS/XPath (Last Resort)

Only when other options aren't viable.

```typescript
// ⚠️ Less resilient to DOM changes
await page.locator('.btn-primary');
await page.locator('#submit-button');
await page.locator('div.container > button:nth-child(2)');

// ⚠️ XPath
await page.locator('xpath=//button[@class="submit"]');
```

**Drawbacks:**
- Breaks when CSS classes change
- Breaks when DOM structure changes
- Less readable
- Doesn't reflect user perception

## Filtering and Chaining

Combine locators to narrow selection:

```typescript
// ✅ Filter by text
const product = page.getByRole('listitem')
  .filter({ hasText: 'Product 2' });
await product.getByRole('button', { name: 'Add to cart' }).click();

// ✅ Filter by another locator
const row = page.getByRole('row')
  .filter({ has: page.getByRole('cell', { name: 'Alice' }) });
await row.getByRole('button', { name: 'Edit' }).click();

// ✅ Multiple filters
const item = page.getByRole('listitem')
  .filter({ hasText: 'Product' })
  .filter({ has: page.locator('.in-stock') });
```

## Locating in Parent/Child Relationships

```typescript
// ✅ Find parent, then child
const form = page.locator('form.login');
await form.getByLabel('Username').fill('john');
await form.getByLabel('Password').fill('secret');
await form.getByRole('button', { name: 'Submit' }).click();

// ✅ Find specific list item
const products = page.locator('ul.products');
await products.getByText('Product 2').click();

// ✅ Scoped operations
const dialog = page.locator('dialog.confirmation');
await dialog.getByRole('button', { name: 'Confirm' }).click();
```

## Working with Multiple Elements

```typescript
// Count elements
const count = await page.getByRole('listitem').count();

// Get all elements (requires explicit wait)
await page.getByRole('listitem').first().waitFor();
const items = await page.getByRole('listitem').all();
for (const item of items) {
  console.log(await item.textContent());
}

// Access by index
await page.getByRole('listitem').nth(2).click(); // 3rd item (0-indexed)
await page.getByRole('listitem').first().click();
await page.getByRole('listitem').last().click();

// Filter and iterate
const products = await page.getByRole('listitem')
  .filter({ hasText: 'On sale' })
  .all();
```

## Frames and iframes

```typescript
// ✅ Frame locator
const frame = page.frameLocator('iframe#payment');
await frame.getByLabel('Card number').fill('4242424242424242');
await frame.getByRole('button', { name: 'Pay' }).click();

// Wait for frame to load
await frame.locator('body').waitFor();

// Nested frames
const outerFrame = page.frameLocator('iframe#outer');
const innerFrame = outerFrame.frameLocator('iframe#inner');
await innerFrame.getByRole('button').click();
```

## Shadow DOM

```typescript
// ✅ Piercing shadow DOM (enabled by default)
await page.locator('my-component').getByRole('button').click();

// ✅ Explicit shadow root
await page.locator('my-component')
  .locator('css=button') // Pierces shadow automatically
  .click();
```

## Dynamic Locators

Build locators dynamically based on data:

```typescript
// ✅ Dynamic role names
async function clickButton(name: string) {
  await page.getByRole('button', { name }).click();
}

// ✅ Dynamic selectors
async function fillField(label: string, value: string) {
  await page.getByLabel(label).fill(value);
}

// ✅ With conditions
const selector = condition === 'A' ? '#element-a' : '#element-b';
await page.locator(selector).click();
```

## Best Practices Summary

### DO:
- ✅ Use role, label, text - user-facing attributes
- ✅ Use `getByRole()` when possible
- ✅ Use `getByLabel()` for form fields
- ✅ Filter and chain for precision
- ✅ Use `getByTestId()` when semantic locators aren't stable

### DON'T:
- ❌ Use CSS classes as primary locator strategy
- ❌ Use complex XPath expressions
- ❌ Use nth-child unless necessary
- ❌ Hard-code indexes when avoidable
- ❌ Rely on DOM structure (parent/sibling relationships)

## Examples: Converting CSS to Semantic Locators

```typescript
// ❌ CSS-based (brittle)
await page.locator('.btn-primary').click();
await page.locator('#username-input').fill('john');
await page.locator('div.container > form > input:nth-child(2)').fill('secret');

// ✅ Semantic (resilient)
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Username').fill('john');
await page.getByLabel('Password').fill('secret');
```

```typescript
// ❌ Complex CSS (hard to maintain)
await page.locator('ul.products li:nth-child(2) button.add-to-cart').click();

// ✅ Semantic chain (clear intent)
const product = page.getByRole('listitem').filter({ hasText: 'Product 2' });
await product.getByRole('button', { name: 'Add to cart' }).click();
```

## Official Documentation

- [Locators](https://playwright.dev/docs/locators)
- [Best Practices](https://playwright.dev/docs/best-practices#use-locators)
- [ARIA Roles](https://www.w3.org/TR/wai-aria-1.2/#role_definitions)
```

```file:./references/anti-patterns.md
# Anti-Patterns to Avoid

Detailed explanation of deprecated patterns and why to avoid them.

## waitForNavigation (Deprecated)

### Why it's deprecated

`waitForNavigation()` is officially deprecated in Playwright because:

1. **Race conditions**: Must be set up before the action that triggers navigation
2. **Complex coordination**: Requires Promise.all() for proper timing
3. **Better alternatives exist**: `waitForURL()` and auto-waiting are more reliable

### Examples

```typescript
// ❌ Deprecated: waitForNavigation with race condition risk
const navigationPromise = page.waitForNavigation();
await page.click('button');
await navigationPromise;

// ✅ Use instead: waitForURL (recommended replacement)
await page.click('button');
await page.waitForURL('**/next-page');

// ✅ Or wait for next page element (most stable)
await page.click('button');
await page.waitForSelector('#next-page-element', { timeout: 30 * 1000 });
```

### Migration path

Replace all instances of `waitForNavigation()` with either:
- `waitForURL()` when URL pattern is predictable
- `waitForSelector()` for next page's unique element (most reliable)
- Trust auto-waiting when using locator actions

## networkidle (Unreliable)

### Why it's unreliable

`networkidle` waits for 500ms of no network activity, which causes problems:

1. **False positives**: Network quiets temporarily before page is ready
2. **Unpredictable**: Depends on network timing, not page state
3. **Not recommended for tests**: Official docs discourage test usage

### Examples

```typescript
// ❌ Unstable: networkidle can complete prematurely
await page.waitForLoadState('networkidle', { timeout: 30 * 1000 });

// ✅ Use instead: Wait for specific element
await page.waitForSelector('#content-loaded', { timeout: 30 * 1000 });

// ✅ Or use 'load' state (more reliable)
await page.waitForLoadState('load', { timeout: 30 * 1000 });
```

### Real-world issue

```typescript
// ❌ Problem: Navigation completes before next page is ready
const currentUrl = page.url();
await page.waitForURL((url) => url.toString() !== currentUrl);
await page.waitForLoadState('networkidle'); // ❌ Can finish too early!

// Next operation fails because page isn't actually ready
await page.locator('select#year').selectOption('2024'); // ❌ Element not ready

// ✅ Solution: Wait for specific element
const currentUrl = page.url();
await page.waitForURL((url) => url.toString() !== currentUrl);
await page.waitForSelector('select#year', { timeout: 30 * 1000 }); // ✅ Waits for actual element
await page.locator('select#year').selectOption('2024'); // ✅ Works reliably
```

## page.evaluate() for Element Operations

### Why to avoid

Using `page.evaluate()` for clicks/interactions bypasses critical safety checks:

1. **No auto-waiting**: Doesn't wait for element to exist
2. **No actionability checks**: Doesn't verify element is clickable
3. **Misses overlays**: Clicks even when element is obscured
4. **Poor debugging**: Not properly recorded in traces
5. **Not user-realistic**: Doesn't simulate real user interactions

### Actionability checks that get bypassed

| Check | Locator.click() | page.evaluate() |
|-------|----------------|-----------------|
| Element exists | ✓ Auto-waits | ❌ Throws if missing |
| Element visible | ✓ Checks | ❌ Clicks anyway |
| Element stable | ✓ Waits | ❌ No check |
| Not obscured | ✓ Checks | ❌ Clicks anyway |
| Element enabled | ✓ Checks | ❌ Clicks anyway |

### Examples

```typescript
// ❌ Avoid: Direct DOM manipulation
await page.evaluate(() => {
  document.querySelector('button').click();
});

// Problems:
// - Clicks even if button is hidden
// - Clicks even if button is disabled
// - Clicks even if button is covered by modal
// - No retry if button doesn't exist yet

// ✅ Use instead: Locator with auto-waiting
await page.locator('button').click();

// Benefits:
// - Waits for button to exist
// - Verifies button is visible
// - Verifies button is enabled
// - Verifies button isn't obscured
// - Auto-retries until timeout
```

### When page.evaluate() is appropriate

Only use `page.evaluate()` for:

```typescript
// ✅ Appropriate: Reading state
const isChecked = await page.evaluate(() => {
  return document.querySelector('input').checked;
});

// ✅ Appropriate: Complex calculations
const totalHeight = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.item'))
    .reduce((sum, el) => sum + el.offsetHeight, 0);
});

// ❌ NOT for: Element interactions
// Use locator methods instead
```

## Unnecessary Promise.all with Navigation

### Why it's unnecessary in Playwright

Playwright's locator methods automatically wait for navigation:

```typescript
// ❌ Unnecessary: Playwright auto-waits for navigation
await Promise.all([
  page.waitForNavigation(),
  page.click('button')
]);

// ✅ Simpler: Just click (auto-waits)
await page.click('button');
```

### When Promise.all IS needed

Only use `Promise.all()` for events that DON'T auto-wait:

```typescript
// ✅ Necessary: New tab/window doesn't auto-wait
const [newPage] = await Promise.all([
  page.context().waitForEvent('page'),
  page.click('a[target="_blank"]')
]);

// ✅ Necessary: Dialog handling
const [dialog] = await Promise.all([
  page.waitForEvent('dialog'),
  page.click('button.delete')
]);
await dialog.accept();

// ✅ Necessary: Download handling
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click('a.download')
]);
```

## Excessive waitForSelector

### Why it's often unnecessary

Locator actions already include waiting:

```typescript
// ❌ Redundant: Double waiting
await page.waitForSelector('button');
await page.locator('button').click();

// ✅ Sufficient: Click includes waiting
await page.locator('button').click();

// ❌ Redundant: Double waiting
await page.waitForSelector('input');
await page.locator('input').fill('text');

// ✅ Sufficient: Fill includes waiting
await page.locator('input').fill('text');
```

### When waitForSelector IS needed

Use `waitForSelector()` only for:

```typescript
// ✅ Conditional page destinations
await page.click('.next-button');
const waitSelector = condition === 'A'
  ? '#page-a-element'
  : '#page-b-element';
await page.waitForSelector(waitSelector, { timeout: 30 * 1000 });

// ✅ Before locator.all() (doesn't auto-wait)
await page.locator('.item').first().waitFor();
const items = await page.locator('.item').all();

// ✅ Waiting for element to disappear
await page.locator('.loading').waitFor({ state: 'hidden' });
```

## Mixing waitForURL with networkidle

### The problem

Combining these creates unstable tests:

```typescript
// ❌ Unstable combination
const currentUrl = page.url();
await page.waitForURL((url) => url.toString() !== currentUrl);
await page.waitForLoadState('networkidle'); // ❌ May finish before page is ready

// Next operation fails unpredictably
await page.locator('select#year').selectOption('2024'); // ❌ Element not ready
```

### The solution

Wait for specific elements instead:

```typescript
// ✅ Stable approach
await page.click('.next-button');
await page.waitForSelector('select#year', { timeout: 30 * 1000 });

// Now element is definitely ready
await page.locator('select#year').selectOption('2024'); // ✅ Works reliably
```

## Summary: Migration Guide

| Old Pattern | New Pattern | Reason |
|------------|------------|---------|
| `waitForNavigation()` | `waitForURL()` or `waitForSelector()` | Deprecated, race conditions |
| `networkidle` | `waitForSelector()` or `load` | Unreliable, can finish early |
| `page.evaluate(() => el.click())` | `locator.click()` | Bypasses safety checks |
| `Promise.all([waitForNavigation, click])` | `click()` alone | Auto-waits for navigation |
| `waitForSelector()` + `locator.action()` | `locator.action()` alone | Redundant waiting |
```

```file:./references/actions.md
# Element Actions

Detailed guide to element action methods and their behavior.

## Click Operations

### Basic Click

```typescript
// Standard click
await page.getByRole('button', { name: 'Submit' }).click();

// With options
await page.getByRole('button').click({
  timeout: 5 * 1000,           // Custom timeout
  force: false,            // Skip actionability checks (not recommended)
  noWaitAfter: false,      // Wait for navigation after click
  trial: false,            // Dry run - checks without clicking
  clickCount: 1,           // Number of clicks
  delay: 0,                // Delay between mousedown and mouseup
  button: 'left',          // 'left', 'right', 'middle'
  modifiers: [],           // ['Alt', 'Control', 'Meta', 'Shift']
  position: undefined      // { x: number, y: number }
});
```

### Click Variants

```typescript
// Double click
await page.getByText('Item').dblclick();

// Right click (context menu)
await page.getByText('File').click({ button: 'right' });

// Middle click
await page.getByRole('link').click({ button: 'middle' });

// Click with modifier keys
await page.getByText('Item').click({ modifiers: ['Shift'] });
await page.getByText('Link').click({ modifiers: ['ControlOrMeta'] }); // Ctrl on Windows/Linux, Cmd on Mac

// Click at specific position (relative to element)
await page.getByRole('canvas').click({ position: { x: 100, y: 200 } });
```

### Actionability Checks for Click

Before clicking, Playwright verifies:

1. **Visible**: Element has bounding box and not `visibility: hidden`
2. **Stable**: Element position doesn't change for 2 consecutive frames
3. **Receives Events**: Element isn't obscured by another element
4. **Enabled**: Element doesn't have `disabled` attribute

```typescript
// ✅ All these checks happen automatically
await page.getByRole('button').click();

// ⚠️ Force click (skips checks - rarely needed)
await page.getByRole('button').click({ force: true });
```

### When to Use force: true

Only use `force: true` when:
- Element is intentionally obscured but still clickable
- Testing overlays or complex UI states
- You understand the risks of bypassing safety checks

```typescript
// ⚠️ Example: Clicking element behind overlay (rare case)
await page.locator('.hidden-button').click({ force: true });
```

## Text Input Operations

### fill() - Standard Text Input

Recommended for most text input scenarios.

```typescript
// Basic usage
await page.getByLabel('Email').fill('user@example.com');

// With options
await page.getByLabel('Email').fill('user@example.com', {
  timeout: 5 * 1000,
  noWaitAfter: false,
  force: false
});
```

**What fill() does:**
1. Focuses the element
2. Clears existing content
3. Types new content
4. Fires `input` event

**Actionability checks:**
- Visible
- Enabled
- Editable (not `readonly`)

**Supported elements:**
- `<input>` (except type=file)
- `<textarea>`
- `[contenteditable]` elements

### pressSequentially() - Character-by-Character Input

Use only when you need individual key events.

```typescript
// Types character by character with delays
await page.locator('input').pressSequentially('Hello World', { delay: 100 });

// Use cases:
// - Autocomplete fields that need keydown events
// - Fields with character-by-character validation
// - Simulating slow typing
```

### type() - Deprecated, Use fill() or pressSequentially()

```typescript
// ❌ Deprecated
await page.locator('input').type('text');

// ✅ Use fill() instead
await page.getByLabel('Username').fill('text');

// ✅ Or pressSequentially() if you need key events
await page.getByLabel('Search').pressSequentially('text', { delay: 100 });
```

### clear() - Clear Input Field

```typescript
// Clear content
await page.getByLabel('Email').clear();

// fill() automatically clears first
await page.getByLabel('Email').fill('new@example.com'); // Clears then fills
```

## Checkbox and Radio Operations

### check() and uncheck()

```typescript
// Check checkbox
await page.getByLabel('I agree').check();

// Uncheck checkbox
await page.getByLabel('Subscribe').uncheck();

// Radio button (use check)
await page.getByLabel('Option A').check();

// With options
await page.getByLabel('I agree').check({
  timeout: 5 * 1000,
  force: false,
  noWaitAfter: false,
  trial: false,
  position: undefined
});
```

**Actionability checks:**
- Visible
- Stable
- Receives Events
- Enabled

**Supported elements:**
- `<input type="checkbox">`
- `<input type="radio">`
- `[role="checkbox"]`
- `[role="radio"]`

### setChecked() - Ensure Specific State

```typescript
// Set to checked (idempotent)
await page.getByLabel('Remember me').setChecked(true);

// Set to unchecked (idempotent)
await page.getByLabel('Remember me').setChecked(false);

// Useful when you don't know current state
const shouldCheck = userPreference === 'remember';
await page.getByLabel('Remember me').setChecked(shouldCheck);
```

## Select Operations

### selectOption() - Dropdown Selection

```typescript
// Select by label (visible text)
await page.getByLabel('Country').selectOption({ label: 'Japan' });

// Select by value attribute
await page.getByLabel('Country').selectOption({ value: 'jp' });

// Select by index (0-based)
await page.getByLabel('Country').selectOption({ index: 1 });

// Select multiple options
await page.locator('select[multiple]').selectOption(['option1', 'option2']);

// Select by element handle
const option = await page.locator('option').nth(2).elementHandle();
await page.locator('select').selectOption(option);
```

**Actionability checks:**
- Visible
- Enabled

**Works with:**
- `<select>` elements only
- For custom dropdowns, use click() and filter operations

### Custom Dropdowns (Not <select>)

```typescript
// Open dropdown
await page.getByRole('button', { name: 'Select country' }).click();

// Select option
await page.getByRole('option', { name: 'Japan' }).click();

// Or with listbox role
await page.getByRole('listbox').getByText('Japan').click();
```

## Hover Operations

### hover() - Mouse Over

```typescript
// Basic hover
await page.getByRole('button', { name: 'Menu' }).hover();

// With options
await page.getByRole('button').hover({
  timeout: 5 * 1000,
  force: false,
  noWaitAfter: false,
  trial: false,
  position: { x: 10, y: 10 },
  modifiers: ['Shift']
});
```

**Actionability checks:**
- Visible
- Stable
- Receives Events

**Use cases:**
- Reveal tooltips
- Show dropdown menus
- Trigger hover effects before clicking

## Focus Operations

```typescript
// Set focus
await page.getByLabel('Username').focus();

// Remove focus (blur)
await page.getByLabel('Username').blur();

// Focus and type
await page.getByLabel('Username').focus();
await page.keyboard.type('john');
```

## Keyboard Operations

### press() - Single Key Press

```typescript
// Press single key
await page.getByLabel('Search').press('Enter');
await page.press('body', 'Control+S'); // Save shortcut

// Common keys:
// 'Enter', 'Escape', 'Tab', 'Backspace', 'Delete'
// 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
// 'Home', 'End', 'PageUp', 'PageDown'
// 'F1' through 'F12'

// With modifiers:
await page.press('body', 'Control+A'); // Select all
await page.press('body', 'Meta+C');    // Copy on Mac
await page.press('body', 'Shift+Tab'); // Reverse tab
```

### Keyboard Navigation

```typescript
// Navigate with keyboard
await page.keyboard.press('Tab');         // Next field
await page.keyboard.press('Shift+Tab');   // Previous field
await page.keyboard.press('Enter');       // Submit
await page.keyboard.press('Escape');      // Close dialog

// Arrow keys in lists/dropdowns
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowUp');
```

## Drag and Drop

```typescript
// Drag and drop
await page.getByRole('listitem', { name: 'Item 1' }).dragTo(
  page.getByRole('listitem', { name: 'Item 3' })
);

// With coordinates
await page.locator('.draggable').dragTo(page.locator('.drop-zone'), {
  sourcePosition: { x: 0, y: 0 },
  targetPosition: { x: 100, y: 100 }
});
```

## File Upload

```typescript
// Upload single file
await page.getByLabel('Upload file').setInputFiles('path/to/file.pdf');

// Upload multiple files
await page.getByLabel('Upload files').setInputFiles([
  'file1.pdf',
  'file2.pdf'
]);

// Clear file input
await page.getByLabel('Upload file').setInputFiles([]);

// Upload from buffer
await page.getByLabel('Upload file').setInputFiles({
  name: 'file.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('file content')
});
```

## Scroll Operations

```typescript
// Scroll element into view (happens automatically before actions)
await page.getByRole('button').scrollIntoViewIfNeeded();

// Scroll by pixels
await page.evaluate(() => window.scrollBy(0, 100));

// Scroll to bottom
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

// Scroll specific element
await page.locator('.scrollable').evaluate(el => el.scrollTop = 100);
```

## Taking Screenshots

```typescript
// Screenshot specific element
await page.getByRole('dialog').screenshot({ path: 'dialog.png' });

// With options
await page.locator('.component').screenshot({
  path: 'component.png',
  type: 'png',          // 'png' or 'jpeg'
  quality: 80,          // For JPEG only
  omitBackground: true, // Transparent background
  animations: 'disabled' // 'disabled' or 'allow'
});
```

## Actionability Reference Table

| Action | Visible | Stable | Receives Events | Enabled | Editable |
|--------|---------|--------|----------------|---------|----------|
| click() | ✓ | ✓ | ✓ | ✓ | - |
| dblclick() | ✓ | ✓ | ✓ | ✓ | - |
| fill() | ✓ | - | - | ✓ | ✓ |
| clear() | ✓ | - | - | ✓ | ✓ |
| check() | ✓ | ✓ | ✓ | ✓ | - |
| uncheck() | ✓ | ✓ | ✓ | ✓ | - |
| selectOption() | ✓ | - | - | ✓ | - |
| hover() | ✓ | ✓ | ✓ | - | - |
| focus() | - | - | - | - | - |
| press() | - | - | - | - | - |
| setInputFiles() | ✓ | - | - | ✓ | - |

## Official Documentation

- [Actions](https://playwright.dev/docs/input)
- [Actionability](https://playwright.dev/docs/actionability)
- [Keyboard](https://playwright.dev/docs/api/class-keyboard)
