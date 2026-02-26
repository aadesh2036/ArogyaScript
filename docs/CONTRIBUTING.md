# Contributing to ArogyaScript

## Branch Rules

- **Never push directly to `main` or `dev`**
- Create feature branches from `dev`
- Open a PR to `dev` when your feature is ready
- Get at least 1 review before merging

## Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Branches | `feature/<area>` | `feature/backend`, `feature/frontend` |
| Commits | `<type>(<scope>): <description>` | `feat(api): add upload endpoint` |
| Files | camelCase (JS), snake_case (Python) | `authController.js`, `ocr_engine.py` |

## Commit Types

- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation
- `refactor` — code restructuring
- `chore` — tooling, deps, config

## Avoiding Merge Conflicts

Each contributor owns a separate directory:

| Contributor | Directory | Shared Files |
|-------------|-----------|-------------|
| Backend | `backend/` | `shared/contracts/` (read-only) |
| Frontend | `frontend/` | `shared/contracts/` (read-only) |
| ML Engineer | `ml-pipeline/` | `shared/contracts/` (read-only) |

Only the project lead modifies `shared/contracts/`. All contributors read from it.

## Code Review Checklist

- [ ] Code runs locally without errors
- [ ] Follows project structure conventions
- [ ] No hardcoded secrets
- [ ] API responses match shared contract schema
