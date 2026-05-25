# FAQ

The following are frequently asked questions about OCUDU deployment and capacity planning.
A key design principle of OCUDU is to be as agnostic and generic as possible: there are no
strict hard-coded limits. The system is designed to scale up and down as a function of the
available compute resources.

## Are there separate OCUDU software packages for the CU and the DU, or are they installed on a single server?

Both CU and DU can be installed on a single server. Either as seperate applications or as a co-located (all-in-one) gNB.

## How many DUs are supported by one CU?

There is no hard-coded limit. However, the number of DU accepted by a single CU can be limited with the `--max_nof_dus` parameter.

## How many RUs / radio cells are supported by one DU?

There is no hard-coded limit. If the physical layers runs in software, the number of component-carriers/sectors/cells primarily depends on
the cell bandwidth and MIMO layers supported by the underlying compute.

## How many 5G UEs can be managed by the CU and DU?

There is also no hard limit. The maximum number of UEs depends on a number of cell parameters, especially in TDD
networks the number of uplink resources is a critical dimensioning factor.
However, OCUDU is constantly tested in scenarios that have 1500 UEs per carrier in active mode.