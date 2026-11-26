## AGENTS.md

Rules for any coding agent (and any human) working on this repository. Read this file before changing anything.

### Project

Camarlingo is a property management application for Italian condominium administrators (_amministratori di condominio_). It runs as a desktop app on Windows, macOS and Linux. All data stays local.

A minimal web mode runs the same Rust logic behind a small HTTP server, so the app can be used from a browser on a tablet or phone and tested end to end in a real browser. It is temporary and kept apart (see Web mode).

This repository holds the first version. It covers one complete flow: from the owners' registry to the payment reminder.

Every change reaches `main` through a Pull Request reviewed by the other member.

### Stack

| Part                         | Technology                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| Domain logic and data access | Rust (workspace of small crates)                                                            |
| Desktop shell                | Tauri 2                                                                                     |
| Web mode (temporary)         | Axum HTTP server in `crates/web-server`, serving the same Svelte build                      |
| Database                     | SQLite (rusqlite): one file per condominium plus one for the office (`studio.db`)           |
| User interface               | Svelte 5, SvelteKit in SPA mode, Tailwind CSS, shadcn-svelte                                |
| Unit tests                   | `cargo test` with rstest and mockall (Rust), Vitest (frontend)                              |
| Property tests               | proptest                                                                                    |
| End-to-end tests             | Playwright in TypeScript, BDD with playwright-bdd, against the web mode in a real browser   |
| Coverage                     | cargo-llvm-cov (Rust), Vitest coverage (frontend); 90% minimum each at delivery             |
| Lint, format, type check     | rustfmt, clippy; ESLint, Prettier, svelte-check                                             |
| Delivery                     | Docker image on ghcr.io (runs the web mode); desktop binaries for every OS and architecture |
| CI/CD                        | GitHub Actions                                                                              |

### Commands

Every command runs from the repository root with project-local dependencies only (no global installs). Prerequisites: Rust (stable, 1.90 or later), Node.js 24 or later, and on Linux the Tauri system libraries (WebKitGTK 4.1, libappindicator, librsvg).

| Task                                   | Command                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------- |
| Install the frontend dependencies      | `npm ci`                                                                   |
| Run the desktop app in development     | `npm run tauri dev`                                                        |
| Build the desktop installers           | `npm run tauri build`                                                      |
| Format                                 | `cargo fmt --all` and `npm run format`                                     |
| Lint                                   | `cargo clippy --workspace --all-targets -- -D warnings` and `npm run lint` |
| Type check the frontend                | `npm run check`                                                            |
| Unit tests                             | `cargo test --workspace` and `npm test`                                    |
| Frontend coverage                      | `npm run test:coverage`                                                    |
| Rust coverage (needs `cargo-llvm-cov`) | `cargo llvm-cov --workspace --exclude camarlingo`                          |

The two coverage commands only report the numbers. The minimum is enforced by `test.yml` (see Pipeline).

### Pipeline

- `.github/workflows/lint.yml`: rustfmt and clippy (warnings are errors); ESLint, Prettier and svelte-check.
- `.github/workflows/test.yml`: `cargo llvm-cov` (runs `cargo test`) and Vitest, both with a minimum coverage of lines and of branches (regions in Rust).
- `.github/workflows/commits.yml`: commitlint with the conventional config on every commit of the push or Pull Request. It runs for every change, documentation included.
- All three run on every push to any branch and on every Pull Request to `main`. A failed check fails the run.
- `.github/workflows/release.yml`: started by hand (Actions, "Release", Run workflow) with a version number. It builds the desktop app on Windows, macOS and Linux and attaches the installers to a draft GitHub release, which is published by hand after a check.
- The minimum coverage is `COVERAGE_MIN` in `test.yml`, the only place to change it. It starts low and is raised as the code grows, up to 90% before delivery.
- The Tauri shell crate is not built in lint and test, so no system webview libraries are needed. This is why no logic may live in it.
- Each step is skipped until the part it checks exists (`Cargo.toml`, `package-lock.json`).

### Architecture rules

- Layout: `crates/domain` (`camarlingo-domain`, pure types and calculation rules), `crates/app` (`camarlingo-app`, application services), `crates/db` (`camarlingo-db`, SQLite repositories), `src-tauri` (`camarlingo`, the desktop shell), and the SvelteKit app at the root (`src/`). Dependencies point inwards: `app` and `db` may use `domain`, the shell uses `app` (and `db`, to choose the implementations at startup), nothing depends on the shell.
- The domain crate knows nothing about the database or Tauri. Application services do not depend on Tauri, so another front end (for example a web server) can reuse them.
- Services depend on traits. Concrete implementations are chosen at startup; tests use fakes or mocks.
- Main traits: `AllocationRule` (one implementation per allocation criterion), `Notifier` (sends payment reminders), one repository trait per area (`CondominiumRepository`, `RegistryRepository`, `TableRepository`, `InstallmentRepository`, `PaymentRepository`).
- Tauri commands are thin adapters over the application services. No business logic in them, and none in the frontend.
- One module per feature, in Rust and in Svelte, with its own database migrations.

### Web mode

The web mode exists for browser use and end-to-end tests. It must stay small and removable.

- `crates/web-server` is the only crate that knows HTTP. Each route is a thin adapter over an application service, exactly like a Tauri command: no business logic in it.
- Routes mirror the Tauri commands one to one: same name, same input and output types, same error format.
- `src/lib/backend.ts` is the only frontend file that knows the transport: it calls Tauri `invoke` in the desktop app and `fetch` in the browser. Pages and components import from it and never call `invoke` or `fetch` directly.
- Login is minimal: one password set by an environment variable, then a session cookie. No user accounts.
- The layout is responsive (Tailwind breakpoints), so pages work on a tablet or phone. This is plain good practice and stays in the desktop app too.
- The Docker image builds the Svelte app and runs `web-server`, which serves it with the API.
- Removing the web mode means: delete `crates/web-server/` and the `Dockerfile`, drop its line from the workspace `Cargo.toml`, keep only the `invoke` branch in `backend.ts`, and remove the Docker and e2e jobs from the workflows. Nothing else may depend on it.

### Calculation rules

- Amounts are integer cents (`Cents(i64)`), never floating point, in Rust and in the frontend.
- Every allocation sums exactly to the total. Leftover cents are assigned with the largest-remainder method, ties broken by unit id.
- Same inputs, same output: calculations are deterministic and reproducible.
- Amounts typed by the user (`1.234,56`) are parsed in Rust, never with JavaScript numbers.

### Code style

- Everything in English: code, identifiers, comments, commit messages, Issues, Pull Requests and documentation. Italian domain terms appear only in the glossary below and in user-facing strings.
- Readability over compactness: explicit names, short functions, small files grouped by purpose, no duplicated code.
- Precise types on every parameter and return value (Rust, strict TypeScript).
- Lint and type-check rules stay enabled. Fix warnings; do not silence them.
- Comments explain what the code does and why it is written that way. Never its history or origin (where it was copied from, what changed, what it used to be): that belongs in commit messages and Pull Requests.

### Tests

- Tests live in fixed places:

  | Test                         | Where                                                                                  |
  | ---------------------------- | -------------------------------------------------------------------------------------- |
  | Rust unit                    | `#[cfg(test)] mod tests` at the bottom of the file under test                          |
  | Rust integration (crate API) | `crates/<crate>/tests/<feature>.rs`                                                    |
  | Frontend unit (Vitest)       | next to the module: `<module>.test.ts`                                                 |
  | End-to-end (Playwright)      | `e2e/features/*.feature`, `e2e/steps/`, `e2e/pages/` (Page Objects), `e2e/fixtures.ts` |

- Every unit test follows Arrange, Act, Assert, marked by the comments `// arrange`, `// act`, `// assert`. Given, When, Then is for end-to-end tests only.
- Prefer parametrized tests: `#[rstest]` with `#[case]` in Rust, `it.each` inside a `describe` in Vitest. A Rust test with no cases or fixtures uses plain `#[test]`.
- Svelte components hold no logic, so they are covered by the end-to-end tests, not by Vitest. Vitest covers the `.ts` modules in `src/lib`.
- Use mocks and spies where a dependency has side effects (clock, mail, file system). Test real behaviour, not implementation details.
- End-to-end tests run against the web mode in a real browser: Playwright starts `web-server` with an empty data folder for each run. They describe user flows in BDD style (Given, When, Then) and use the Page Object pattern. Page Objects locate elements the way a user would recognise them: `getByRole` first, then `getByLabel`, then `getByText`. `data-testid` (`getByTestId`) is the last choice, only when none of these fits; then it is kebab-case and prefixed by the page, for example `condominium-list-row`. Never CSS classes or XPath. Never wait for a fixed time.
- Coverage below the minimum in the pipeline fails it (see Pipeline).

### Git

- Conventional Commits for every commit, e.g. `feat(allocation): add equal-shares rule`.
- Commit types from the full Conventional Commits 1.0.0 specification: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. commitlint checks every commit in the pipeline.
- One short branch per task, from `main`: `<type>/<ticket-id>-<slug>`, for example `feat/ere-12-equal-shares-rule`.
- `main` is protected: Pull Request, one approving review from the other member, green pipeline.
- Small Pull Requests. No unfinished work left open at delivery.

### Workflow

The team follows RPAC (Refine, Plan, Act, Consolidate) from [agent-toolkit](https://eai-org.github.io/agent-toolkit-docs/task-workflow/). Its skills are included in `.agents/skills/` (see its `README.md`). Pick the skill yourself.

- **Ask before every skill.** Before running a skill the user did not name, ask in one or two sentences: which skill, why it fits now, and what it will do. Run it only after a yes. On a no, carry on with the task without it. A skill that a running skill loads by itself needs no second question.
- **Tickets** live in the team's issue tracker. Fetch them through its MCP server.
- **Planning directory**: `.agents/plans/<id>-<slug>/`, one folder per ticket. Its files are committed, so they are in English and name tickets by id only: no tracker URLs, workspace or project names, or account handles.
- **Size decides the route.**
  - Trivial change (typo, rename, one-line fix, docs wording): no skill, just do it.
  - Small change (one file or one clear behaviour): `fetch-ticket` if there is a ticket, then implement, then `fresh-eyes-review`.
  - Feature or anything touching calculations, data or architecture: the full round below.
  - In doubt, ask which route, proposing one.
- **Full round**, each step in a fresh session that starts from the previous step's file:
  1. `fetch-ticket`, then optionally `review-ticket` and `verify-understanding`.
  2. `refine-ticket` → REQUIREMENTS. `harden-artifact` on it for features touching calculations or data.
  3. `create-implementation-plan` → PLAN. `harden-artifact` on it, then `split-plan-tasks` if it will not fit one Pull Request.
  4. `execute-plan-tasks`, one task per session, until the checklist is done.
  5. `self-review`, then `create-manual-test-instructions` when a person must test it by hand, then `handover` for the Pull Request description.
     `grill-me` fits any step where a decision is still open; `check-ticket-implementation` fits work picked up halfway.
- **At the end of every step**, propose the next skill the same way. If it runs in this session, start it on a yes. If it needs a fresh session, write the hand-off with `prepare-prompt` as one block the user pastes into the new session.
- **Git stays with the user.** Never commit, push or open a Pull Request; propose the commit message instead.
- No agent output reaches `main` without a review by the other team member.

### Skills

Project skills, in `.agents/skills/<name>/SKILL.md`. They follow the same rule: ask before running one the user did not name.

| Skill                 | Purpose                                                   |
| --------------------- | --------------------------------------------------------- |
| `write-unit-test`     | Parametrized AAA unit tests with mocks, in Rust or Vitest |
| `write-e2e-test`      | BDD scenario plus Page Objects with Playwright            |
| `conventional-commit` | Branch name and commit message for a change               |

Building a whole feature and reviewing a change are covered by the RPAC skills above (full round, `self-review`, `fresh-eyes-review`), so there are no separate skills for them.

### Glossary

| Italian                    | Code name              |
| -------------------------- | ---------------------- |
| condominio                 | `Condominium`          |
| stabile, unità immobiliare | `Building`, `Unit`     |
| anagrafe condominiale      | `Registry`             |
| titolare, quota            | `Holder`, `Share`      |
| tabella millesimale        | `ThousandthsTable`     |
| riparto                    | `Allocation`           |
| criterio di riparto        | `AllocationRule`       |
| preventivo                 | `Budget`               |
| rata                       | `Installment`          |
| incasso, versamento        | `Payment`              |
| saldo, estratto conto      | `Balance`, `Statement` |
| moroso                     | `Debtor`               |
| sollecito                  | `PaymentReminder`      |
| amministratore             | `Administrator`        |

### Out of scope for this version

Database encryption, extraordinary works, invoices and suppliers, year-end accounts, meetings, tax obligations, certified email (PEC), signed installers.
