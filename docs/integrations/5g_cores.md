---
sidebar_position: 1
---

# 5G Cores

OCUDU connects to a 5G Core Network (5GC) over the NG interface, supporting both N2 (control plane) and N3 (user plane) connections. The following 5G Cores have been validated for use with OCUDU.

---

## Ella Core

[Ella Core](https://github.com/ellanetworks/core) is an open-source 5G Core designed for private networks. It ships as a single binary, supports both amd64 and arm64 architectures, and leverages eBPF for high-performance packet processing. Ella Core includes a built-in UI and HTTP API for management and monitoring. It can be co-hosted with OCUDU on the same machine for an all-in-one 5G network deployment, or run on a separate host.

### Resources

- [Ella Core Documentation](https://docs.ellanetworks.com/)
- [Ella Core GitHub Repository](https://github.com/ellanetworks/core)
- [OCUDU with Ella Core Tutorial](../user_manual/tutorials/ella_core/index.md)
