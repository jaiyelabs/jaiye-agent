# .jaiye/config.yaml

`config.yaml` is the repo-local protocol file. It tells agents who they are, which paths they own and how CI should treat conflicts.

## Minimal

```yaml
version: 2

project:
  name: "my-project"
  type: "code"

agents:
  - name: claude
    description: "Primary architect"
    type: cli
    capabilities: [code_gen, file_io, git]
    commit_prefix: "[claude]"

ownership:
  - pattern: "src/**"
    agent: claude

settings:
  handoff_dir: ".jaiye/handoffs"
  bridge_dir: ".jaiye/bridges"
  conflict_mode: "warn"
  base_branch: "main"
```

## Fields

### `version`

Current version: `2`.

### `project`

- `name`: repo or project name.
- `type`: `code`, `media`, `content`, `research` or `mixed`.

### `agents`

- `name`: stable agent id used by commands.
- `description`: human-readable role.
- `type`: `cli`, `desktop`, `ide` or `custom`.
- `capabilities`: loose capability tags for humans and future adapters.
- `commit_prefix`: prefix used to identify agent commits in git mode.
- `bridge`: optional bridge file for async handoffs.

### `ownership`

Rules are checked top to bottom. `pattern` uses gitignore-style glob matching.

```yaml
ownership:
  - pattern: "src/**"
    agent: claude
    artifact_type: code
  - pattern: "docs/**"
    agent: gemini
    artifact_type: document
```

`artifact_type` is optional. Common values: `code`, `document`, `media`, `data`, `config`.

### `settings`

- `handoff_dir`: where handoff files are written.
- `bridge_dir`: where bridge files are written.
- `conflict_mode`: `warn` or `error`.
- `base_branch`: default base branch for `check`.

## Scanning

`jaiye-agent init --scan` generates first-pass ownership rules from common project folders:

- `src`, `app`, `lib`, `pages` and `api` -> `claude`
- `components`, `scripts`, `tests` and `__tests__` -> `codex`
- `docs`, `README.md` and markdown files -> `gemini`
- media files, spreadsheets and Word docs -> `cowork`

The scan is a starting point. Review it before adding the CI gate.
