---
sidebar_label: Using container images
description: "Find the published OCUDU container images, understand how they are tagged, and verify their signature, SBOM and vulnerability report before you run them."
---

# Using the OCUDU container images

## Overview

OCUDU publishes ready-to-run container images for every RAN component. The OCUDU CI builds each image and signs it
with [Sigstore cosign](https://docs.sigstore.dev/cosign/). Each image also carries a signed Software Bill of Materials
(SBOM) and a signed vulnerability report.

This tutorial covers the following topics:

- Choose the image that matches your component, radio front-end and CPU
- Read the image tags
- Verify the signature of an image
- Check the vulnerability count of an image
- Download the SBOM of an image

### Further reading

- [Sigstore cosign documentation](https://docs.sigstore.dev/cosign/)
- [Rekor transparency log](https://docs.sigstore.dev/logging/overview/)
- [grype vulnerability scanner](https://github.com/anchore/grype)

---

## Software requirements

To verify an image, install the following tools:

- [cosign](https://docs.sigstore.dev/cosign/system_config/installation/), to check signatures and attestations
- [jq](https://jqlang.org/), to filter the JSON output
- [grype](https://github.com/anchore/grype#installation) (optional), to scan an image yourself

---

## Available images

### Registries

| Registry                                                                               | Base OS         | Contents                                  |
| -------------------------------------------------------------------------------------- | --------------- | ----------------------------------------- |
| [`registry.gitlab.com/ocudu/ocudu`](https://gitlab.com/ocudu/ocudu/container_registry) | Ubuntu 24.04    | Component images and the all-in-one image |
| Red Hat (registration required)                                                        | Red Hat UBI 9.6 | Component images, Red Hat certified       |

:::info
The Red Hat certified images are available only through Red Hat. They are not published to the GitLab registry. To use
them, register with Red Hat, then run the images on Red Hat OpenShift. You can find the OCUDU images here: [OCUDU Openshift Container Registry](https://catalog.redhat.com/en/software/container-stacks/detail/6a26e781f2bd217b68833734).
:::

### Component images

Each component image contains a single OCUDU application. Pick the image for the component you want to run. Then pick
the radio driver and the CPU variant that match your hardware.

| Component   | Image                     | Application   | Driver | Radio front-end                    |
| ----------- | ------------------------- | ------------- | ------ | ---------------------------------- |
| gNB         | `images/gnb-uhd`          | `gnb`         | UHD    | USRP (split 8)                     |
| gNB         | `images/gnb-dpdk`         | `gnb`         | DPDK   | O-RAN RU over Open Fronthaul (7.2) |
| DU          | `images/du-uhd`           | `odu`         | UHD    | USRP (split 8)                     |
| DU          | `images/du-dpdk`          | `odu`         | DPDK   | O-RAN RU over Open Fronthaul (7.2) |
| CU          | `images/cu`               | `ocu`         | None   | None                               |
| CU-CP       | `images/cu-cp`            | `ocucp`       | None   | None                               |
| CU-UP       | `images/cu-up`            | `ocuup`       | None   | None                               |
| RU emulator | `images/ru-emulator-dpdk` | `ru_emulator` | DPDK   | Emulates split 7.2 RU              |

Every image above is built for three CPU variants:

| Architecture | CPU variant | Compiler target               | Tag label |
| ------------ | ----------- | ----------------------------- | --------- |
| amd64        | AVX2        | `x86-64-v3`                   | `avx2`    |
| amd64        | AVX-512     | `x86-64-v4`                   | `avx512`  |
| arm64        | NEON        | `neoverse-n1+crc+crypto+ssbs` | `neon`    |

This gives 8 images × 3 CPU variants = **24 builds** on Ubuntu 24.04.

:::tip
The AVX-512 variant is faster, but it only runs on CPUs that support AVX-512. To check your host, run
`grep -o -m1 avx512f /proc/cpuinfo`. If it prints nothing, use the AVX2 variant.
:::

The Red Hat certified versions of the same component images are built on Red Hat UBI 9.6.

The SBOM of each image records the UHD or DPDK version bundled in it. See [Get the SBOM](#get-the-sbom).

### All-in-one image

The all-in-one image contains every OCUDU application in one image: `gnb`, `odu`, `ocu`, `ocucp`, `ocuup`,
`ru_emulator` and the split variants. It is built with both UHD and DPDK. It is meant for development. It is built from
the same `docker/Dockerfile` that the `docker compose` setups in the
[`docker/`](https://gitlab.com/ocudu/ocudu/-/tree/dev/docker) folder of the OCUDU repository use.

The nightly build publishes the all-in-one image to `registry.gitlab.com/ocudu/ocudu/`:

| Image                           | Driver     | amd64 AVX2 | amd64 AVX-512 | arm64 |
| ------------------------------- | ---------- | :--------: | :-----------: | :---: |
| `ocudu_nightly_<variant>`       | UHD + DPDK |     ✓      |       ✓       |   ✓   |
| `ocudu_nightly_<variant>_debug` | UHD + DPDK |     ✓      |       ✓       |   ✓   |

`<variant>` is `avx2`, `avx512` or `arm64`. The `_debug` images include debug symbols.

---

## Image tags

Component image tags follow this pattern:

```
<os>-<os-version>-<cpu-variant>-<YYYYMMDD>_<commit>          e.g. ubuntu-24.04-avx512-20260924_c999afee
<os>-<os-version>-<cpu-variant>-<YYYYMMDD>_<commit>-stable   promoted build
```

The all-in-one image tags follow this pattern:

```
<YYYYMMDD>_<commit>          e.g. 20260914_75146075
<YYYYMMDD>_<commit>-stable   promoted build
latest                       most recent nightly build
```

- **Date-based tags** come from the nightly build. Component images also get a date-based tag for every change merged
  to `main`.
- **`-stable` tags** mark a build that has been promoted. Before the CI promotes a build, it verifies the signatures,
  the SBOM and the vulnerability report of the image. Use these tags for deployments.
- **`latest`** exists only for the all-in-one image. It follows the nightly build.

---

## Verifying an image

Every published image is signed and has these attestations attached:

| Attestation | Type               | Contents                                                                         |
| ----------- | ------------------ | -------------------------------------------------------------------------------- |
| Signature   | None               | Proves that the OCUDU CI pipeline built and pushed the image                     |
| SBOM        | `spdx`, `spdxjson` | Two SPDX 2.3 documents: the container packages (JSON) and the OCUDU build (text) |
| CVE scan    | `vuln`             | The [grype](https://github.com/anchore/grype) vulnerability report               |

Each image and each attestation is signed twice:

- **Keyless.** The signature is tied to the identity of the OCUDU GitLab pipeline. It is recorded in the public
  [Rekor](https://docs.sigstore.dev/logging/overview/) transparency log. You do not need to download a key.
- **With the OCUDU cosign key.** You verify this signature with the OCUDU public key, `cosign.pub`. See
  [Check the signature with the OCUDU public key](#check-the-signature-with-the-ocudu-public-key).

You can use either signature. The commands in this section use the keyless signature.

The examples below use `registry.gitlab.com/ocudu/ocudu/images/cu:ubuntu-24.04-avx512-20260924_c999afee`. Replace it
with the image you want to check.

### Check the signature

Verify the signature with the following command:

```bash
cosign verify \
  --certificate-identity-regexp '^https://gitlab.com/ocudu/ocudu//.gitlab-ci.yml@refs/heads/(main|dev)$' \
  --certificate-oidc-issuer https://gitlab.com \
  registry.gitlab.com/ocudu/ocudu/images/cu:ubuntu-24.04-avx512-20260924_c999afee
```

A valid image prints the following output:

```
Verification for registry.gitlab.com/ocudu/ocudu/images/cu:ubuntu-24.04-avx512-20260924_c999afee --
The following checks were performed on each of these signatures:
  - The cosign claims were validated
  - Existence of the claims in the transparency log was verified offline
  - The code-signing certificate was verified using trusted certificate authority certificates
```

If the OCUDU pipeline did not sign the image, `cosign` exits with an error.

:::note
Nightly builds are signed from the `dev` branch. Builds from `main` and `-stable` tags are signed from `main`. To
accept only `main` builds, replace the regular expression with
`--certificate-identity https://gitlab.com/ocudu/ocudu//.gitlab-ci.yml@refs/heads/main`.
:::

#### Check the signature with the OCUDU public key

The CI publishes the OCUDU public key next to each image in the
[GitLab package registry](https://gitlab.com/ocudu/ocudu/-/packages). The package name is the image name, and the
package version is the image tag. Download the key for the example image:

```bash
curl -fLO https://gitlab.com/api/v4/projects/ocudu%2Focudu/packages/generic/cu/ubuntu-24.04-avx512-20260924_c999afee/cosign.pub
```

Then verify the image with the key:

```bash
cosign verify --key cosign.pub \
  registry.gitlab.com/ocudu/ocudu/images/cu:ubuntu-24.04-avx512-20260924_c999afee
```

To use the key for the attestations below, replace the `--certificate-identity-regexp` and
`--certificate-oidc-issuer` options with `--key cosign.pub`.

### Check the vulnerability count

The CI scans every published image with grype and attaches the signed report to the image. To read the report and
count the vulnerabilities by severity, run:

```bash
cosign verify-attestation --type vuln \
  --certificate-identity-regexp '^https://gitlab.com/ocudu/ocudu//.gitlab-ci.yml@refs/heads/(main|dev)$' \
  --certificate-oidc-issuer https://gitlab.com \
  registry.gitlab.com/ocudu/ocudu/images/cu:ubuntu-24.04-avx512-20260924_c999afee \
  | jq -r '.payload | @base64d | fromjson | .predicate.scanner.result.matches[].vulnerability.severity' \
  | sort | uniq -c
```

The report lists every vulnerability that grype finds, including those without a fix yet. The CI scans the same
package inventory that the container SBOM describes. The CI marks the build as failed if it finds a *critical*
vulnerability that has a fix available.

#### Scan the image yourself

The attached report reflects the vulnerability database on the day the image was built. For an up-to-date count, scan
the image directly with grype:

```bash
grype registry.gitlab.com/ocudu/ocudu/images/cu:ubuntu-24.04-avx512-20260924_c999afee -o json \
  | jq -r '.matches[].vulnerability.severity' | sort | uniq -c
```

Example output:

```
     14 Low
      3 Medium
      8 Negligible
```

This counts every known vulnerability, including those without a fix yet. To count only vulnerabilities that have a
fix available, add `--only-fixed`.

### Get the SBOM

To download the signed SBOM of an image, run:

```bash
cosign verify-attestation --type spdx \
  --certificate-identity-regexp '^https://gitlab.com/ocudu/ocudu//.gitlab-ci.yml@refs/heads/(main|dev)$' \
  --certificate-oidc-issuer https://gitlab.com \
  registry.gitlab.com/ocudu/ocudu/images/cu:ubuntu-24.04-avx512-20260924_c999afee \
  | jq -r '.payload | @base64d | fromjson | .predicate'
```

The command prints two SPDX documents:

- The container SBOM, in SPDX JSON format. It lists the packages in the container.
- The build SBOM, in SPDX text format. It describes the OCUDU build and the libraries it is built with.

To see which UHD or DPDK version an image contains, pipe the output through
`grep -A5 -E '^PackageName: (UHD|DPDK)$' | grep -E 'PackageName|PackageVersion'`. For a DPDK image, the output is:

```
PackageName: DPDK
PackageVersion: 25.11.2
```

For a UHD image, the output is:

```
PackageName: UHD
PackageVersion: 4.6.0.0
```

#### Download the signed files

The CI also publishes the SBOM files and the grype report to the
[GitLab package registry](https://gitlab.com/ocudu/ocudu/-/packages), next to `cosign.pub`. Each file has a detached
signature:

| File                  | Contents                          |
| --------------------- | --------------------------------- |
| `container.spdx.json` | The container SBOM, in SPDX JSON  |
| `build.spdx`          | The build SBOM, in SPDX text      |
| `grype-report.json`   | The grype vulnerability report    |
| `<file>.sig`          | The detached signature of a file  |

To download the build SBOM of the example image and check its signature, run:

```bash
BASE=https://gitlab.com/api/v4/projects/ocudu%2Focudu/packages/generic/cu/ubuntu-24.04-avx512-20260924_c999afee
curl -fLO "${BASE}/cosign.pub"
curl -fLO "${BASE}/build.spdx"
curl -fLO "${BASE}/build.spdx.sig"
cosign verify-blob --key cosign.pub --signature build.spdx.sig build.spdx
```

A valid file prints `Verified OK`.

## Next steps

- [Running on Kubernetes](../k8s/index.md): deploy the components as Kubernetes pods.
