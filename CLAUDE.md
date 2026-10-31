@AGENTS.md

## Notes for Claude Code

- Project skills live in `.claude/skills/`. Load the matching skill before you write code: `clean-code` always, plus `service-architecture`, `contract-first`, `secure-coding`, `testing` or `pr-workflow` when the task touches that area.
- Before editing, read the issue and check `docs/PARALLEL_PLAN.md` for what it is blocked by and which folders it may touch.
- Prefer many small files over one big one. If a file you are editing would pass 250 lines, split it first in its own commit.
- Run `pnpm lint && pnpm typecheck && pnpm test` for the packages you touched before you push (`pnpm turbo run test --filter=<package>`).
- Never open a PR into `main`. Never merge anything yourself.
- Never write secrets, tokens, real phone numbers or customer data into code, tests, fixtures, commits or PR text.
