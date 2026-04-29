# Project Instructions

## Git Workflow
- **Always commit and push** to `origin main` after every change to the rulebook or any project file. Do not ask for confirmation — just push.
- Use descriptive commit messages summarizing what changed.

## Project Location
- Repository: `C:\AMP\WarHams` (WSL: `/mnt/c/AMP/WarHams`)
- Design files: `C:\AMP\WarHams\design` (WSL: `/mnt/c/AMP/WarHams/design`)
- **NEVER forget this path. Always use it when working on the project.**

## PDF Generation
- After editing `WARHAMS-Rulebook.md`, always regenerate the PDF by running `node generate-pdf.js` from the `design/` directory.
- Include the regenerated PDF in the commit.
