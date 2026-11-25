---
name: conventional-commit
description: Propose the branch name and the Conventional Commits message for a change. Use when a task starts (branch) and when a change is ready to commit, or when the user asks how to name a commit or branch.
metadata:
  version: "1.0"
---

# Conventional commit

Git stays with the user: this skill proposes the branch name and the commit message, it does not
run `git commit`, `git push` or open a Pull Request.

## One branch per task

Each task (one ticket) gets its own short branch from an up-to-date `main`:

```
<type>/<ticket-id>-<short-slug>
```

For example `feat/ere-12-equal-shares-rule`. Lowercase, words joined by `-`.

## The message

```
<type>(<scope>): <summary>

<body, optional>

<footer, optional>
```

**Types**, from the Conventional Commits 1.0.0 specification:

| Type | When |
| --- | --- |
| `feat` | A new behaviour for the user |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting only, no change in meaning |
| `refactor` | Code change with no change in behaviour |
| `perf` | Faster or lighter, same behaviour |
| `test` | Tests added or changed, no production code |
| `build` | Build system or dependencies (`Cargo.toml`, `package.json`) |
| `ci` | Pipeline (`.github/workflows/`) |
| `chore` | Anything else that does not touch code or tests |
| `revert` | Reverts an earlier commit |

commitlint (conventional config) checks every commit in the pipeline: a message that does not
follow these rules fails the run.

**Scope**: the feature module or area touched, lowercase (`allocation`, `registry`,
`installments`, `ui`, `web`, `deps`). Leave it out only when the change has no single area.

**Summary**: English, imperative, lowercase, no final period, at most 72 characters including
type and scope. Says what the commit does: `add equal-shares rule`, not `added stuff`.

**Body**: only when the why is not obvious. Wrap at 72 characters. Explain why and what changes
for the user, not how the code works.

**Footer**:
- `Refs: <ticket-id>` to link the ticket.
- A change that breaks a saved file format or a public interface: `!` after the type or scope
  (`feat(storage)!: ...`) and a `BREAKING CHANGE: <what breaks>` line.

The message describes the change only: no signatures, trailers or notes added by tools.

## Steps

1. Look at the staged changes (`git diff --staged`, or the change just made if nothing is
   staged).
2. If they mix unrelated things (a fix and a refactor), propose splitting them into separate
   commits.
3. Pick the type, then the scope, then write the summary. Add body and footer only if needed.
4. Show the message in one code block, ready to paste, with one line on why that type.

Before a branch is shared, the user may clean up their own commits with `git rebase -i`
(squash, reword). After a Pull Request is open, conflicts are solved by updating the branch
with `main` (merge or rebase), never by rewriting someone else's commits.

## Examples

```
feat(allocation): add equal-shares rule
fix(registry): keep holder share when the unit is renamed
test(installments): cover rounding of the last installment
refactor(db): move migrations into one module per feature
docs(readme): add screenshot of the condominium list
ci(lint): run clippy on every branch
build(deps): update rusqlite
```
