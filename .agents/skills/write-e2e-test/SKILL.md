---
name: write-e2e-test
description: Write end-to-end tests with Playwright in TypeScript as a BDD .feature scenario plus Page Objects that locate elements by role, label or text, as a user would. Use when a user flow is added or changed, when a bug is visible in the interface, or when the user asks for an e2e test.
metadata:
  version: "1.0"
---

# Write end-to-end tests

An end-to-end test checks one user flow from the outside, the way an administrator would use the
app. It is black-box: it never imports application code and never reads the database. It runs
against the web mode (see `AGENTS.md`), the same interface and Rust logic as the desktop app.

## Where things go

| What | Where |
| --- | --- |
| Scenarios, in English | `e2e/features/<flow>.feature` |
| Step definitions | `e2e/steps/<flow>.steps.ts` |
| Page Objects, one class per page | `e2e/pages/<page>.page.ts` |
| Fixtures (Page Objects, login, test data) | `e2e/fixtures.ts` |

`.feature` files become Playwright tests through `playwright-bdd`.

## Steps

1. **Write the scenario first.** `Feature`, an optional `Background` for shared setup, then one
   `Scenario` (or `Scenario Outline` with `Examples`) per behaviour. Given sets up the state,
   When is the user action, Then is the visible result. One When per scenario.
2. **Find or create the Page Object** for each page the scenario touches.
   - All locators live in the Page Object, never in steps or scenarios.
   - Locators follow what a user recognises, in this order:
     1. `page.getByRole(...)` with the accessible name (`{ name: 'Save' }`);
     2. `page.getByLabel(...)` for form fields;
     3. `page.getByText(...)` for visible text;
     4. only when none of these fits (for example a table row with no accessible name),
        `page.getByTestId(...)`. Test ids are kebab-case and start with the page:
        `condominium-list-row`. Add the attribute to the Svelte component and change nothing
        else in it.
   - If an element cannot be found by role or label, the interface probably lacks a label or an
     accessible name: propose adding it rather than reaching for a test id.
   - Methods are user actions (`fillName`, `save`) or read a visible result (`errorMessage`).
     A Page Object knows only its own page; it does not decide where to go next. The step does.
3. **Write the steps** by calling Page Object methods only. Given steps arrange, When steps act,
   Then steps assert; mark them with the `// arrange`, `// act`, `// assert` comments.
4. **Use the real backend.** The tests run in a real browser against the web mode:
   `playwright.config.ts` starts `web-server` (`webServer` option) with an empty data folder.
   Each scenario creates the data it needs through the interface, or through a Given step that
   calls the same HTTP routes; no scenario depends on another. Logging in is done once in a
   fixture, not in every scenario.
5. **Run and look at the trace** of any failure.

## Rules

- **Never wait for a fixed time**: no `waitForTimeout`, no sleeps. Use web-first assertions
  (`await expect(locator).toBeVisible()`, `toHaveText`, `toHaveValue`), which retry on their own.
- Never CSS selectors or XPath: they break when the layout changes.
- One flow per scenario; keep scenarios short (about 3 to 7 steps).
- Text in scenarios is the user's language of the domain, not implementation details.
- `playwright.config.ts` keeps `trace: 'retain-on-failure'`; in the pipeline, `test-results/`
  is uploaded as an artifact.
- Useful while writing: `npx playwright codegen`, `PWDEBUG=1`, `npx playwright show-trace`.

## Example

```gherkin
Feature: Create a condominium

  Background:
    Given the office has no condominiums

  Scenario: Save a condominium with a valid tax code
    Given the administrator opens the new condominium form
    When the administrator saves "Via Roma 1" with tax code "80012345678"
    Then "Via Roma 1" appears in the condominium list
```

```ts
export class CondominiumFormPage {
  readonly name: Locator;
  readonly taxCode: Locator;
  readonly save: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByLabel('Denominazione');
    this.taxCode = page.getByLabel('Codice fiscale');
    this.save = page.getByRole('button', { name: 'Salva' });
  }

  async open(): Promise<void> {
    await this.page.goto('/condominiums/new');
  }

  async create(name: string, taxCode: string): Promise<void> {
    await this.name.fill(name);
    await this.taxCode.fill(taxCode);
    await this.save.click();
  }
}

export class CondominiumListPage {
  constructor(private readonly page: Page) {}

  row(name: string): Locator {
    return this.page.getByRole('row', { name });
  }
}
```

```ts
When('the administrator saves {string} with tax code {string}',
  async ({ condominiumForm }, name: string, taxCode: string) => {
    // act
    await condominiumForm.create(name, taxCode);
  });

Then('{string} appears in the condominium list', async ({ condominiumList }, name: string) => {
  // assert
  await expect(condominiumList.row(name)).toBeVisible();
});
```

Run: `npx playwright test` (or `npx bddgen && npx playwright test`).

## Done when

- The scenario passes three runs in a row (`--repeat-each=3`), so it is not flaky.
- No fixed waits, no locators outside Page Objects.
- Report to the user: scenarios added, Page Objects created or changed, labels or test ids
  added to components and why.
