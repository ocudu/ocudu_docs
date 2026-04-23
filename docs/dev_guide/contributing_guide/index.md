# Contributing Guidelines

Welcome! We are glad that you want to contribute to OCUDU.
The project accepts contributions via Gitlab merge requests.
This document outlines the process to help get your contribution accepted.

## Reporting a Security Issue

Most of the time, when you find a bug in OCUDU, it should be reported using [Gitlab issues](https://gitlab.com/ocudu/ocudu/-/issues).
However, if you are reporting a _security vulnerability_, please email a report to [security@ocudu.org](mailto:security@ocudu.org).
This will give us a chance to try to fix the issue before it is exploited in the wild.

We welcome vulnerability reports and fixes, but do not accept contributions derived from unauthorized access or data exfiltration.

## Outline

* New Contributor Guide
  * [Ways to Contribute](#ways-to-contribute)
  * [Issues](#issues)
  * [Proposing an Idea](#proposing-an-idea) (Tier 1: GitLab issue · Tier 2: OIP)
  * [Merge Requests](#merge-requests)
  * [Licensing](#licensing)
  * [Labels](#labels)

As you get started, you are in the best position to give us feedback on areas of
our project that we need help with including:

* Problems found during setting up a new developer environment
* Gaps in our Quickstart Guide or documentation
* Bugs in our automation scripts

If anything doesn't make sense, or doesn't work when you run it, please open a
bug report and let us know!

## Ways to Contribute

We welcome many different types of contributions including:

* New features
* Builds, CI/CD
* Bug fixes
* Documentation
* Issue Triage
* Answering questions (e.g. in Gitlab)

Not everything happens through a Gitlab pull request. Please come to our
[meetings](https://ocudu.org) or [contact us](https://ocudu.org) and let's discuss how we can work
together. 

### Come to Meetings

Absolutely everyone is welcome to come to any of our meetings. You never need an
invite to join us. In fact, we want you to join us, even if you don’t have
anything you feel like you want to contribute. Just being there is enough!

You can find out more about our meetings [here](https://ocudu.org). You don’t have to turn on
your video. The first time you come, introducing yourself is more than enough.
Over time, we hope that you feel comfortable voicing your opinions, giving
feedback on others’ ideas, and even sharing your own ideas, and experiences.


## Issues

Issues are used as the primary method for tracking anything to do with the project.

### Issue Types

There are 5 types of issues (each with their own corresponding [label](#labels)):

- `question/support`: These are support or functionality inquiries that we want to have a record of
  for future reference. Generally these are questions that are too complex or large to store in the
  chat (e.g. Slack channel) or have particular interest to the community as a whole. Depending on the
  discussion, these can turn into `feature` or `bug` issues.
- `proposal`: Used for items that propose a new idea or functionality that require
  a larger community discussion. This allows for feedback from others in the community before a
  feature is actually developed. This is not needed for small additions. Final word on whether
  a feature needs a proposal is up to the core maintainers. All issues that are proposals should
  both have a label and an issue title of "Proposal: [the rest of the title]." A proposal can become
  a `feature` and does not require a milestone.
- `feature`: These track specific feature requests and ideas until they are complete. They can
  evolve from a `proposal` or can be submitted individually depending on the size.
- `bug/bug::ci`: These track bugs with the code/infrastructure.
- `docs`: These track problems with the documentation (i.e. missing or incomplete).

### Issue Lifecycle

The issue lifecycle is mainly driven by the core maintainers, but is good information for those
contributing to OCUDU. All issue types follow the same general lifecycle. Differences are noted
below.

1. **Issue creation**
2. **Triage**
    - The maintainer in charge of triaging will apply the proper labels for the issue. This includes
      labels for priority, type, and metadata (such as `good_first_issue`). The only issue priority
      we will be tracking is whether the issue is "critical." If additional levels are needed
      in the future, we will add them.
    - (If needed) Clean up the title to succinctly and clearly state the issue. Also ensure that
      proposals are prefaced with "Proposal: [the rest of the title]".
    - Add the issue to the correct milestone. If any questions come up, don't worry about adding the
      issue to a milestone until the questions are answered.
    - We attempt to do this process at least once per work day.
3. **Discussion**
    - Issues that are labeled `feature` or `proposal` and fall outside the official roadmap
      may require a formal OCUDU Improvement Proposal (OIP) depending on scope.
      See [Proposing an Idea](#proposing-an-idea) for when an OIP is needed. Smaller
      quality-of-life enhancements are exempt.
    - Issues that are labeled as `feature` or `bug` should be connected to the MR that resolves it.
    - Whoever is working on a `feature` or `bug` issue (whether a maintainer or someone from the
      community), should either assign the issue to themselves or make a comment in the issue saying
      that they are taking it.
    - `proposal` and `question/support` issues should stay open until resolved or if they have not
      been active for more than 30 days. This will help keep the issue queue to a manageable size
      and reduce noise. Should the issue need to stay open, the `keep open` label can be added.
4. **Issue closure**


### Find an Issue

We have good first issues for new contributors and help wanted issues suitable
for any contributor. [Good first issue](https://gitlab.com/ocudu/ocudu/-/issues?label_name%5B%5D=good_first_issue) has extra information to
help you make your first contribution.

Sometimes there won’t be any issues with these labels. That’s ok! There is
likely still something for you to work on. If you want to contribute but you
don’t know where to start or can't find a suitable issue, you can check
the [here](https://gitlab.com/ocudu/ocudu/-/issues/68) and ask for suggestions.

Once you see an issue that you'd like to work on, please post a comment saying
that you want to work on it. Something like "I want to work on this" is fine.

## Proposing an Idea

OCUDU uses a two-tier process for proposing new ideas, scaled to the size of the change.

### Tier 1 — Lightweight proposal (most changes)

Open a GitLab issue in the main [ocudu](https://gitlab.com/ocudu/ocudu/-/issues) repository
with the `proposal` label and start the discussion there. A maintainer will triage it within
5 business days. If the scope is small enough the issue is converted directly to a `feature`
and no further process is required.

### Tier 2 — OCUDU Improvement Proposal (significant changes)

A formal **OCUDU Improvement Proposal (OIP)** is required when a change:

- introduces or modifies a public API or wire protocol
- adds a new major subsystem or component
- has cross-layer or cross-team impact
- involves a breaking change for existing users
- requires a TSC decision before work begins

OIPs live in the dedicated [ocudu/community/oips](https://gitlab.com/ocudu/community/oips)
repository. The process is:

```
1. Discuss informally    →  GitLab issue (label: proposal) in the main repo
2. Write an OIP          →  copy the template, open an MR in community/oips
3. Community review      →  minimum 2-week discussion window on the MR
4. Decision              →  TSC/maintainers accept, reject, or request changes
5. Implementation        →  accepted OIP is linked to the code MR(s)
6. Close out             →  OIP moved to accepted/ or rejected/ with rationale
```

The OIP template and full process details are in the
[community/oips README](https://gitlab.com/ocudu/community/oips).

After your proposal has been approved, follow the [developer's guide](https://ocudu.org) to get started.


## Merge Requests

Like any good open source project, we use Merge Requests (MRs) to track code changes.

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the TSC before making a change.

Please note we have a code of conduct, please follow it in all your interactions with the project.

### How to Contribute a Patch

1. Identify or create the related issue.
2. Fork the desired repo; develop and test your code changes.
3. Submit a merge request, making sure to sign your work and link the related issue.

Coding conventions and standards are explained in the [official developer docs](https://ocudu.org).

###  Lifecycle

1. **MR creation**
    - MRs are usually created to add a feature or fix a particular issue.
    - It is preferred, but not required, to have a MR tied to a specific issue. There can be
      circumstances where if it is a quick fix then an issue might be overkill. The details provided
      in the MR description would suffice in this case.
    - MR naming should follow the following scheme "layer/component: title". For example a MR adding MIMO functionality to the PHY layer could be named "phy: add MIMO functionality".
    - We more than welcome MRs that are currently in progress. They are a great way to keep track of
      important work that is in-flight, but useful for others to see. If a MR is a work in progress,
      it **must** be prefaced with "Draft: title". Once the MR is ready for review, remove "Draft:"
      from the title.
2. **Triage**
    - The maintainer in charge of triaging will apply the proper labels for the issue. This should
      include at least a size label, `bug` or `feature`, and `awaiting_review` once all labels are
      applied. See the [Labels section](#labels) for full details on the definitions of labels.
    - Add the MR to the correct milestone. This should be the same as the issue the MR closes.
3. **Assigning reviews**
    - Once a review has the `awaiting_review` label, maintainers will review them as schedule
      permits. The maintainer who takes the issue should self-request a review.
    - MRs from a community member with the label `size/S` or larger requires 2 review approvals from
      maintainers before it can be merged. Those with `size/XS` are per the judgement of the
      maintainers. For more detail see the [Size Labels](#size-labels) section.
4. **Reviewing/Discussion**
    - All reviews will be completed using Gitlab review tool.
    - A "Comment" review should be used when there are questions about the code that should be
      answered, but that don't involve code changes. This type of review does not count as approval.
    - A "Changes Requested" review indicates that changes to the code need to be made before they
      will be merged.
    - Reviewers should update labels as needed (such as `needs_rebase`)
5. **Address comments by answering questions or changing code**
6. **LGTM (Looks good to me)**
    - Once a Reviewer has completed a review and the code looks ready to merge, an "Approve" review
      is used to signal to the contributor and to other maintainers that you have reviewed the code
      and feel that it is ready to be merged.
7. **Merge or close**
    - MRs should stay open until merged or if they have not been active for more than 30 days. This
      will help keep the MR queue to a manageable size and reduce noise. Should the MR need to stay
      open (like in the case of a WIP), the `keep_open` label can be added.
    - Before merging a MR, refer to the topic on [Size Labels](#size-labels) below to determine if
      the MR requires more than one LGTM to merge.
    - If the owner of the MR is listed in the `OWNERS` file, that user **must** merge their own MRs
      or explicitly request another OWNER do that for them.
    - If the owner of a MR is _not_ listed in `OWNERS`, any core maintainer may merge the MR.

### GitLab CI

All merge requests must pass CI/CD pipeline checks before they can be merged into OCUDU. The pipeline automatically runs tests, builds, and validation checks to ensure code quality.

After forking the repository, you need to enable CI/CD runners:

1. Go to your fork's **Settings → CI/CD → Runners**
2. Under the **Instance** tab, enable instance runners (free GitLab Shared Runners)
3. If you encounter issues enabling runners or see a banner stating `Identity verification is required in order to run CI jobs`, follow the [account verification instructions](https://docs.gitlab.com/ci/debugging/#error-identity-verification-is-required-in-order-to-run-ci-jobs)

## Licensing

Licensing is important to open source projects. It provides some assurances that
the software will continue to be available based under the terms that the
author(s) desired. We require that contributors sign off on commits submitted to
our project's repositories. The [Developer Certificate of Origin
(DCO)](https://developercertificate.org/) is a way to certify that you wrote and
have the right to contribute the code you are submitting to OCUDU.
See also [here](https://en.wikipedia.org/wiki/Developer_Certificate_of_Origin) for some
additional reading.

Any contribution requiring a patent license beyond what is already required under relevant
3GPP standards must be disclosed with the contribution. Contributions requiring additional
license requirements must be approved by the TSC committee or a designated subcommittee
of the TSC prior to acceptance into any OCUDU codebase.

### SPDX License Identifiers

All new OCUDU project source code files must have an SPDX License Identifier in the header.
SPDX license identifiers provide a standardized, machine-readable way to declare a file's license,
making it easy for automated tools to detect, audit, and verify licensing across large codebases. 
This improves legal clarity, reduces ambiguity, and simplifies compliance for developers, companies,
and downstream users.
Reference OCUDU SPDX license identifiers are included below.
Files incorporated into OCUDU from other existing open source licensed projects will require using
an appropriate license identifier based on that project's license.

For files not implementing 3GPP specifications the following file header shall be used:
```default
// SPDX-License-Identifier: BSD-3-Clause-Open-MPI
```

For files implementing 3GPP specifications the following file header shall be used:
```default
// SPDX-License-Identifier: BSD-3-Clause-Open-MPI
// Portions of this file may implement 3GPP specifications, which may be subject to additional licensing requirements.
```

### Sign Your Commits

You sign-off by adding the following to your commit messages. Your sign-off must
match the git user and email associated with the commit.

```bash
This is my commit message

Signed-off-by: Your Name <your.name@example.com>
```

Git has a `-s` command line option to do this automatically:

```bash
git commit -s -m 'This is my commit message'
```

If you forgot to do this and have not yet pushed your changes to the remote
repository, you can amend your commit with the sign-off by running:

```bash
git commit --amend -s
```

We encourage contributors to use their normal, publicly recognized name in the DCO sign-off to ensure clear attribution, traceability, and long-term accountability of contributions. 
For example something like `Preferred Firstname Lastname <stable email>`.
Using a consistent real-world identity helps maintain transparency in the project’s history and simplifies compliance, auditing, and collaboration across a broad community.

That said, we understand that security researchers or contributors in sensitive situations may have legitimate reasons not to disclose their full legal name. In such cases, a consistent and professional pseudonym may be used, provided the contributor can validly certify the DCO and maintain a stable contact email.

Please note that the project maintains the right to reject contributions - especially security-related changes - if the source cannot be reasonably trusted or verified. Please
also review our requirements for submitting security related fixes [here](https://docs.ocudu.org/dev_guide/contributing_guide/#reporting-a-security-issue).

## Labels

The following tables define the main label types used for OCUDU. They are split up by category.

### Common

| Label | Description |
| ----- | ----------- |
| `bug` | Marks an issue in the main OCUDU codebase as a bug or a MR as a bugfix |
| `bug::ci` | Marks an issue in the CI/testing code or infrastructure as a bug or a MR as a bugfix |
| `critical` | Marks an issue or MR as critical. This means that addressing the MR or issue is top priority and must be addressed as soon as possible |
| `docs` | Indicates the issue or MR is a documentation change |
| `feature` | Marks the issue as a feature request or a MR as a feature implementation |
| `keep_open` | Denotes that the issue or MR should be kept open past 30 days of inactivity |
| `refactor` | Indicates that the issue is a code refactor and is not fixing a bug or adding additional functionality |

### Issue Specific

| Label | Description |
| ----- | ----------- |
| `help_wanted` | Marks an issue needs help from the community to solve |
| `proposal` | Marks an issue as a proposal |
| `question/support` | Marks an issue as a support request or question |
| `good_first_issue` | Marks an issue as a good starter issue for someone new to OCUDU |
| `wont_fix` | Marks an issue as discussed and will not be implemented (or accepted in the case of a proposal) |

### MR Specific

| Label | Description |
| ----- | ----------- |
| `awaiting_review` | Indicates a MR has been triaged and is ready for someone to review |
| `breaking` | Indicates a MR has breaking changes (such as API changes) |
| `in_progress` | Indicates that a maintainer is looking at the MR, even if no review has been posted yet |
| `needs_rebase` | Indicates a MR needs to be rebased before it can be merged |
| `needs_pick` | Indicates a MR needs to be cherry-picked into a feature branch (generally bugfix branches). Once it has been, the `picked` label should be applied and this one removed |
| `picked` | This MR has been cherry-picked into a feature branch |
| `docs_needed` | Tracks MRs that introduces a feature/change for which documentation update would be desirable (non-blocking). Once a suitable documentation MR has been created, then this label should be removed |

#### Size labels

Size labels are used to indicate how "dangerous" a MR is. The guidelines below are used to assign
the labels, but ultimately this can be changed by the maintainers. For example, even if a MR only
makes 30 lines of changes in 1 file, but it changes key functionality, it will likely be labeled as
`size/L` because it requires sign off from multiple people. Conversely, a MR that adds a small
feature, but requires another 150 lines of tests to cover all cases, could be labeled as `size/S`
even though the number of lines is greater than defined below.

Any changes from the community labeled as `size/S` or larger should be thoroughly tested before
merging and always requires approval from 2 core maintainers. MRs submitted by a core maintainer,
regardless of size, only requires approval from one additional maintainer. This ensures there are at
least two maintainers who are aware of any significant MRs introduced to the codebase.

| Label | Description |
| ----- | ----------- |
| `size/XS` | Denotes a MR that changes 0-9 lines, ignoring generated files. Very little testing may be required depending on the change. |
| `size/S` | Denotes a MR that changes 10-29 lines, ignoring generated files. Only small amounts of manual testing may be required. |
| `size/M` | Denotes a MR that changes 30-99 lines, ignoring generated files. Manual validation should be required. |
| `size/L` | Denotes a MR that changes 100-499 lines, ignoring generated files. |
| `size/XL` | Denotes a MR that changes 500-999 lines, ignoring generated files. |
| `size/XXL` | Denotes a MR that changes 1000+ lines, ignoring generated files. |

---

**Contents:**

import DocCardList from '@theme/DocCardList';

<DocCardList />
