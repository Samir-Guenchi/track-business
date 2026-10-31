# How we work

Team: **Samir Guenchi** (`@Samir-Guenchi`, owner, merges to `main`) and **Abdennour** (`@newabdennour`, collaborator).

## Branches

```
main   <- production. Only Samir merges, and only from dev (or hotfix/*).
 └─ dev   <- integration. Every feature PR targets dev.
     ├─ feat/<issue-number>-short-name
     ├─ fix/<issue-number>-short-name
     └─ chore/<issue-number>-short-name
```

1. Pick an issue assigned to you on the project board and move it to **In progress**.
2. `git switch dev && git pull && git switch -c feat/12-order-import`
3. Open a PR **into `dev`**, write `Closes #12`, request a review from the other person.
4. After one approval and green checks, squash-merge into `dev`.
5. When `dev` is stable (end of a sprint or a milestone), Samir opens `dev -> main` and merges it.

The `Branch policy` check fails any PR into `main` that does not come from `dev` or `hotfix/*`.

## Labels and milestones

- `type:*` epic, feature, chore, research, bug
- `area:*` api, web, mobile, infra, carriers, data, design, product
- `phase:0` to `phase:4` match the milestones in [ROADMAP.md](../ROADMAP.md)
- `priority:P0` must have, `P1` should have, `P2` nice to have

Colours and milestones live in `.github/labels.yml` and `.github/milestones.yml`. Run **Actions -> Repo setup (labels, milestones, epics) -> Run workflow** once after this reaches the default branch; it colours the labels, creates the milestones, attaches every `phase:N` issue to its milestone and links each issue to its epic (the `Part of #N` line). It is safe to rerun. It reruns automatically when those files change on `main`.

---

## One-time setup Samir must do on GitHub

These settings are not available through the API tools Claude used, so they are done by hand. About 10 minutes.

### 1. Protect `main` (only Samir can merge)

Settings -> Rules -> Rulesets -> **New ruleset -> New branch ruleset**

- Name: `main`
- Enforcement status: **Active**
- Bypass list: **Add bypass -> Repository admin** (that is you; Abdennour has *write* so he cannot bypass)
- Target branches: **Add target -> Include by pattern -> `main`**
- Rules:
  - [x] **Restrict updates** (only bypass actors can push or merge into main)
  - [x] **Restrict deletions**
  - [x] **Block force pushes**
  - [x] **Require a pull request before merging** (required approvals: 0, so you can merge your own dev -> main PR)
  - [x] **Require status checks to pass** -> add `only-dev-into-main` (appears after the first PR into main runs it)
- **Create**

### 2. Protect `dev` (everyone merges through reviewed PRs)

New branch ruleset again:

- Name: `dev`, Enforcement: **Active**, Bypass list: **Repository admin** (optional, for emergencies)
- Target: include pattern `dev`
- Rules:
  - [x] **Restrict deletions**
  - [x] **Block force pushes**
  - [x] **Require a pull request before merging**, required approvals **1**, [x] dismiss stale approvals, [x] require conversation resolution
  - [x] **Require status checks to pass** -> add the CI job once issue "CI on GitHub Actions" is done
- **Create**

### 3. Make `dev` the default branch

Settings -> General -> Default branch -> switch icon -> `dev` -> Update. New PRs and clones then start from `dev`.

> Note: workflows started with "Run workflow" run from the default branch, so make sure `dev` contains `.github/workflows/repo-setup.yml` (it does once this PR is merged).

### 4. Merge settings

Settings -> General -> Pull Requests: allow **Squash merging** (default for features) and **Merge commits** (for `dev -> main`), turn on **Automatically delete head branches**.

### 5. Project board

1. Your profile -> **Projects -> New project -> Board** template, name it `TrackEcom`.
2. Board settings (⋯) -> **Workflows**: turn on *Item added to project -> Todo*, *Item closed -> Done*, *Pull request merged -> Done*, and **Auto-add to project** with filter `repo:Samir-Guenchi/track-business is:issue,pr is:open`.
3. Add existing issues: in the board press `+ Add item` -> `#` -> pick `track-business`, or open the repo Issues tab, select all, **Projects -> TrackEcom**.
4. Columns: `Backlog`, `Todo`, `In progress`, `In review`, `Done`.
5. Fields (⋯ -> New field): **Priority** (single select: P0, P1, P2), **Size** (XS, S, M, L, XL), **Phase** (0-4), **Iteration** (2 weeks, start next Sunday).
6. Views: *Board by Status*, *Table grouped by Assignee*, *Roadmap* (layout Roadmap, dates from Milestone).
7. Settings -> **Manage access -> Invite** `newabdennour` with **Write**.
8. Link it to the repo: repo -> Projects tab -> **Link a project -> TrackEcom**.
