# WORKING_RULES.md

Read this before changing the repo.

## Before work

- Read `AGENTS.md`
- Run `git status --short`
- Run `jaiye-agent status` when `.jaiye/config.yaml` exists
- Check ownership before editing files

## During work

- Keep changes small
- Match the existing TypeScript and Commander style
- Do not add dependencies unless the repo already points that way
- Do not create new architecture for small command fixes
- Avoid touching unrelated uncommitted work

## Before reporting done

- Run the checks that fit the change
- For normal code changes, run:

```bash
npm test
npm run typecheck
npm run build
```

- Do not commit, push, publish or deploy unless the task asks for it
