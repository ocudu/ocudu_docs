---
description: "How to report a radio unit, 5G core, switch, or timing device you have integrated with OCUDU."
displayed_sidebar: userDocsSidebar
---

# Report an integration

If you have run OCUDU against a radio unit, 5G core, switch, or timing device, please record the result here. This applies whether the integration worked, worked with restrictions, or did not work at all. A device that did not work is still worth recording.

Reports are submitted as merge requests against the [documentation repository](https://gitlab.com/ocudu/ocudu_docs). There are two sizes of report, and the smaller one is genuinely useful on its own.

## Which report to write

**A table row** is the minimum. It adds your device to the relevant overview page, with any restriction you hit. Choose this if you got the integration working but do not have the time to write a full walkthrough, or if the integration did not complete.

**A guide** is a page that walks a reader through the integration on both the CU/DU and the device side. Choose this if you have working configuration files and a repeatable procedure. See the [Benetel guide](radio_units/benetel.md) for a full example.

You can start with a table row and add a guide later. Nobody is expected to write both in one pass.

## What to include

Copy the block below into your merge request description and fill in what you know. Leave a field as `not recorded` rather than guessing; an unknown firmware version is more useful than a wrong one.

```text
Device type:        RU | 5G core | switch | timing device | test equipment | reference platform
Vendor:
Model:
Placement:          indoor | outdoor | both | n/a
Device firmware:
OCUDU version:      the release you tested against
Verified by:        SRS | Vendor | Community

Fronthaul and cell configuration
  Split:            7.2 | 8 | n/a
  Band:
  Bandwidth:
  Duplexing:        TDD | FDD
  MIMO layers:      DL and UL, for example 4x1
  Sync topology:    for example LLS-C3, PTP grandmaster on the fronthaul switch
  Compression:      for example BFP 9-bit
  NIC and driver:   for example Intel E810, DPDK or raw socket

What worked
  For example: UE attach in SISO at 100 MHz, downlink at maximum rate.

What did not work
  For example: PRACH not detected in FDD. Second Rx antenna untested.

Configuration files
  Attach the gNB YAML you used, and the RU configuration if the device
  exposes one. Strip any addresses or credentials specific to your network.
```

The overview tables carry a short summary of this: the device, its firmware, who verified it, and a one-clause note. The rest belongs in a guide, or in the merge request description if you are only adding a row.

### Notes on specific fields

- **Verified by.** `SRS` for a result from the SRS lab, `Vendor` where the device maker verified its own unit, `Community` for anyone else.
- **OCUDU version.** Releases up to 25.10 are srsRAN Project releases and 26.04 onwards are OCUDU releases; either is a valid reference point. State which one you used.
- **Where the record lives.** A device's own guide is the authoritative record for that device; the category overview tables summarise the guides. If you find a table row that disagrees with a guide, fix the table.
- **Configuration files.** These are the most valuable part of a report. A sample gNB YAML that is known to work against a specific firmware version answers most of the questions a later reader will have.

## How to submit

1. Fork [ocudu/ocudu_docs](https://gitlab.com/ocudu/ocudu_docs) and create a branch.
2. Add your device.
   - For a table row, edit the overview page for the device category, for example `docs/integrations/radio_units/index.md`. Keep the table in alphabetical order by vendor, and keep your note in the Notes column to a single clause. Anything longer belongs in a guide.
   - For a guide, create the page and register it in the sidebar. The [documentation contribution guide](../dev_guide/contributing_guide/contributing_docs.md#adding-a-new-integration-guide) covers the file locations, the required frontmatter, and the sidebar entry.
3. Add configuration files to the `assets/` directory beside the guide, and link to them from the page.
4. Open a merge request with the filled-in block above in the description.

You do not need to get the documentation conventions right on the first try. Open the merge request with the technical content correct and the review will sort out the rest.

## Where to ask first

If you are mid-integration and stuck, ask in the [community discussions](https://gitlab.com/ocudu/community/discussions) before writing a report. If the problem turns out to be an OCUDU bug rather than a configuration issue, raise it on the [issue tracker](https://gitlab.com/ocudu/ocudu/-/issues).
