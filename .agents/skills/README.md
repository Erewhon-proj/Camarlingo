# Skills

## From agent-toolkit

Source: [eai-org/agent-toolkit](https://github.com/eai-org/agent-toolkit), commit `d0e27a0`, MIT licence (see `LICENSE-agent-toolkit`).

Workflow skills: `fetch-ticket`, `attach-to-ticket`, `review-ticket`, `verify-understanding`, `refine-ticket`, `grill-me`, `create-implementation-plan`, `harden-artifact`, `split-plan-tasks`, `execute-plan-tasks`, `check-ticket-implementation`, `fresh-eyes-review`, `self-review`, `create-manual-test-instructions`, `handover`, `prepare-prompt`.
Dependencies: `explain-in-simple-language`, `use-conversational-language`.

Local changes, only in the YAML front matter:

- `disable-model-invocation: true` removed, and "Invoke manually only." replaced by a "Use when …" sentence, so the agent can pick the skill on its own.
- `fetch-ticket` lists Linear among the trackers.

To update: copy the upstream skill folders over these ones and re-apply the changes above.

## Project skills

Written for this project: `write-unit-test`, `write-e2e-test`, `conventional-commit`. See `AGENTS.md` for when to use them.
