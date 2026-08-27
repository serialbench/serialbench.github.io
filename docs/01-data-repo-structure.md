# 01 — Data repo structure

## What

Set up `serialbench/data` with the dated-run directory format that every
benchmark run deposits into. Pure data, no code, no workflows.

## Structure

```
runs/
  2026-08-30/                          # one dir per run attempt (UTC date)
    ubuntu-24.04-ruby-3.4.xml.yaml     # one file per platform × ruby × format
    ubuntu-24.04-ruby-3.4.json.yaml
    macos-26-ruby-4.0.xml.yaml
    ...
README.md                              # format documentation
```

## Rules

- Files are named `{platform}-ruby-{version}.{format}.yaml`
- Each file is the exact `results.yaml` that `serialbench environment execute` produces
- A run with 30/46 legs deposits 30×4 files — partial data is valid
- Files are append-only; never modified once committed
- The site derives everything (availability, versions, trends) from these files

## Acceptance

- [ ] `runs/` directory exists
- [ ] `README.md` documents the naming convention and YAML schema
- [ ] Repo is pushed to `serialbench/data`
