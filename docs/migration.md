---
description: "How to port existing srsRAN Project modifications to OCUDU."
displayed_sidebar: userDocsSidebar
---

# Migrating from srsRAN to OCUDU

OCUDU is the successor to srsRAN Project. Under Linux Foundation governance, the codebase moved from GitHub to GitLab with a licence change from AGPLv3 to BSD 3-Clause and a focus on commercial-grade Open RAN deployments. The underlying architecture is unchanged, so your mental model of srsRAN is a valid starting point for OCUDU. The [Architecture Overview](/dev_guide/architecture_overview/) describes how OCUDU is organised. The fork point, commit [7d6183f](https://github.com/srsran/srsRAN_Project/commit/7d6183f), is the last commit the two projects share.

This guide shows you how to port existing modifications from srsRAN Project to OCUDU. Most changes do not require a rewrite. The effort depends on the scope and location of your work. This guide provides a general blueprint; it does not cover the specific requirements of each migration scenario.

There is no automated translation tool. Migration is a manual process.

## What You Need

- Your srsRAN Project fork or branch that contains your changes
- A complete git history of those changes (not a squashed snapshot; you need individual commits to generate a clean diff). A linear history rebases most cleanly. If your branch contains merge commits or was developed across multiple integrated branches, the rebase steps in this guide will require more manual work and the outcome is harder to predict.
- A test setup or recorded results from your srsRAN validation
- A [GitLab account](https://gitlab.com/users/sign_up) if you plan to file issues or contribute changes back to OCUDU

## Steps

:::tip Getting stuck?
The [issue tracker](https://gitlab.com/ocudu/ocudu/-/issues) and [community channels](/community/) are the right places to ask at any point in the process.
:::

### 1. Rebase onto the OCUDU fork point

Confirm you are on your feature branch before proceeding:

```bash
git status
```

Rebase your changes onto the fork point commit in your srsRAN repository:

```bash
git rebase 7d6183f
```

This puts your commits directly on top of the last commit both projects share. Resolve all conflicts before you move on. Unresolved conflicts carry forward into every subsequent step.

If your branch is based on a srsRAN commit later than `7d6183f`, use the `--onto` form to rebase only your changes:

```bash
git rebase --onto 7d6183f <old-base>
```

Replace `<old-base>` with the srsRAN commit your branch originally branched from. To identify it, list the commits unique to your branch:

```bash
git log --oneline origin/main..HEAD
```

The commit just before the oldest entry in that list is your old base. Replace `origin` with whatever remote name points to the srsRAN Project upstream if it differs. If you are unsure, ask in the [community channels](/community/) before you proceed.

### 2. Export your changes as patch files

```bash
git format-patch 7d6183f..HEAD -o ~/migration-patches/
```

This exports each of your commits as a numbered patch file in `~/migration-patches/`, preserving commit messages and authorship. Saving to your home directory keeps the patches outside both repositories and avoids path issues in later steps. Review the list of patch files before you move on. The list should contain only your commits, with no srsRAN commits included.

### 3. Validate your changes on srsRAN Project

If you have a recent, recorded test baseline, verify it is current. If not, run your unit tests, integration tests, and any functional validation in your target setup now. Record what passes.

If your srsRAN test environment is no longer available, use any recorded test results, logs, or CI history as your baseline. The goal is to know what passed before you start, not to rebuild the environment.

This step establishes a known-good baseline before OCUDU enters the picture. If a test fails after the port, you need to know whether the cause is an error in the port or a problem that already existed on srsRAN.

### 4. Set up and build OCUDU

Clone OCUDU:

```bash
git clone https://gitlab.com/ocudu/ocudu.git
cd ocudu
```

Follow the [Installation Guide](/user_manual/installation/) to build a clean OCUDU binary. To verify the binary runs, follow the [Testmode tutorial](/tutorials/testmode/), which requires no radio hardware. Any build failure at this stage comes from the environment, not your changes.

Before you start porting, review the [Releases](/releases/) page and run the following command to see what OCUDU has changed since the fork point:

```bash
git log 7d6183f..HEAD --oneline
```

To scope this to files you plan to modify, append the path:

```bash
git log 7d6183f..HEAD --oneline -- <path/to/subsystem>
```

### 5. Apply your patches to OCUDU

Create a new branch in the OCUDU repository starting from the fork point:

```bash
git checkout -b my-migration 7d6183f
```

Apply your patches:

```bash
git am --3way ~/migration-patches/*.patch
```

The `--3way` flag enables merge-style conflict resolution: if a patch does not apply cleanly, git falls back to a 3-way merge rather than failing outright. Because both codebases are identical at `7d6183f`, most patches should apply without conflict at this stage.

If `git am` stops on a conflict, resolve the conflict, stage the file, and continue:

```bash
git add <file>
git am --continue
```

Build after all patches are applied to confirm a clean baseline before the next step.

### 6. Rebase onto the latest OCUDU

```bash
git fetch origin
git rebase origin/main
```

This brings your work forward from the fork point to the current OCUDU state. This is the most demanding step. OCUDU has diverged significantly from the fork point, and conflicts are expected.

**Variable and symbol renames:** OCUDU has renamed a number of variables, types, and function names from their srsRAN equivalents. When a conflict involves a name that does not exist in OCUDU, search the OCUDU source tree for the equivalent. If your code references a renamed symbol and git does not flag it as a conflict (the patch applied cleanly but no longer compiles), the build error will identify what is missing. Use the following command to trace a rename through the OCUDU history:

```bash
git log --all -S <symbol-name> --oneline
```

**Other conflict sources:**
- **Structural changes:** a file your patch touches may have been reorganised in OCUDU. Use the [Architecture Overview](/dev_guide/architecture_overview/) as a reference.
- **File moves:** if a file no longer exists at the expected path, search the OCUDU source tree before assuming it is missing.
- **Build system changes:** if your patches include CMakeLists changes, resolve those first.

Resolve conflicts one commit at a time. After each resolved conflict:

```bash
git add <file>
git rebase --continue
```

Build after each resolved commit to catch compile errors before they accumulate.

### 7. Validate on OCUDU

Re-run the same tests from step 3. Compare the results against the baseline you recorded.

Failures at this stage fall into two categories:

- **Port errors:** your change did not translate correctly. Debug against your patches from step 2.
- **Behavioural differences:** OCUDU behaves differently from srsRAN Project in a way unrelated to your changes. Before you file a report, check the [Releases](/releases/) page and search the [issue tracker](https://gitlab.com/ocudu/ocudu/-/issues) for known issues. If the problem is not already documented, report it with a description of the expected and actual behaviour.

### 8. Continue development on OCUDU

Once your changes are validated on OCUDU, make it your primary development base. The two projects will diverge further over time, so the sooner you consolidate, the less rework you face.

Follow the [Releases](/releases/) page for changelogs, and watch the [OCUDU GitLab project](https://gitlab.com/ocudu/ocudu) for new versions.

## GitHub to GitLab

If you maintained a GitHub fork of srsRAN Project, the following areas require attention when you move your development base to GitLab. The git operations in this guide are identical on both platforms, but the surrounding workflow differs:

- **Authentication:** set up a GitLab SSH key for command-line access, or a personal access token for HTTPS access. Credentials from GitHub do not carry over.
- **Remote URL:** update the remote in your local repository. Use the SSH form if you have set up an SSH key:
  ```bash
  git remote set-url origin git@gitlab.com:ocudu/ocudu.git
  ```
  Or the HTTPS form if you are using a personal access token:
  ```bash
  git remote set-url origin https://gitlab.com/ocudu/ocudu.git
  ```
- **CI/CD pipelines:** GitHub Actions workflows do not run on GitLab. OCUDU uses GitLab CI (`.gitlab-ci.yml`). Adapt any pipelines you rely on before you depend on them.
- **Pull requests become merge requests:** the workflow is the same, but the terminology and UI differ.
- **Integrations and webhooks:** any GitHub-specific integrations (notifications, deployment hooks, external services) need to be reconfigured on GitLab.

## Getting Help

- **Issue tracker:** [gitlab.com/ocudu/ocudu/-/issues](https://gitlab.com/ocudu/ocudu/-/issues) for bugs or unexpected behaviour during migration
- **Community:** see the [Community](/community/) page for discussion channels and community calls
