---
description: Git branching and commit workflow for this project
---

# Git Workflow

## Branching Strategy
- Always create a feature branch from `main` before starting work
- Branch naming: `feature/<short-description>` or `fix/<short-description>`
- Commit frequently at logical units of work

## Commit Flow
// turbo-all
1. Stage changes: `git add .` or specific files
2. Commit with descriptive message (Japanese OK): `git commit -m "<message>"`
3. Push the branch: `git push -u origin <branch-name>`

## Merge
- After completing work on a branch, merge back to main if approved
