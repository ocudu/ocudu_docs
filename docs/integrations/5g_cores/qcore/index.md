---
description: "Connecting OCUDU to QCore, an ultra-compact single-binary 5G Core for private networks, co-hosted on one machine."
---

# QCore

## Overview

[QCore](https://github.com/nplrkn/qcore) is a free, ultra-compact 5G Core for private networks, written in Rust. It is a single 32 MB executable with a monolithic design: there are no internal service-based interfaces, which keeps control-plane processing cheap. The user plane is implemented in eBPF. QCore exposes the three standard interfaces OCUDU needs from a core: N2 (NG-C) over SCTP, N3 (NG-U) over GTP-U, and N6 towards the outside world.

This guide covers co-hosting QCore and OCUDU on a single machine, which is QCore's primary deployment model. The core plane is the same regardless of the radio front-end: it was verified in our lab over a LiteX-M2SDR via SoapySDR, but nothing in the QCore integration depends on the radio, so any OCUDU-supported front-end applies and the sample configuration uses a generic RF section.

A distinctive QCore feature is **DHCP-based UE addressing**. QCore issues DHCP requests on behalf of each UE, so a connected device gets an address directly on the host LAN with no local NAT. For deployments where that is not wanted, QCore can instead manage a private `/24` UE subnet with Linux NAT.

QCore can also run in **F1 mode**, acting as the gNB-CU as well as the core so that OCUDU connects to it as a gNB-DU over F1 rather than as a full gNB over NG. This guide covers both: the NG deployment below, and [F1 mode](#f1-mode-qcore-as-the-gnb-cu) at the end.

### Resources

- [QCore GitHub repository](https://github.com/nplrkn/qcore)
- [QCore srsRAN demo](https://github.com/nplrkn/qcore/tree/master/docs/srsRAN-testing) (ZMQ-based, QCore in F1 mode)

---

## Pre-requisites

- A Linux host with a working LAN interface (this guide uses `wlp5s0`; substitute your own).
- A Rust toolchain, to build QCore. Follow the build steps in the [QCore README](https://github.com/nplrkn/qcore#readme).
- `iptables` installed (`sudo apt install iptables`).
- An OCUDU-supported RF front-end and a 5G Standalone capable UE with a programmable test SIM.

---

## 1. Set up QCore routing

QCore relies on a `tun` device, a veth pair, and IPv4 forwarding that its `setup-routing` script configures. Run it **before** starting QCore, passing your LAN interface as the argument. Without it QCore exits because `qcoretun` does not exist.

```shell
cd ~/qcore
sudo ./setup-routing wlp5s0
```

This enables `net.ipv4.ip_forward`, creates the `qcoretun` tun device and the `veth0`/`veth1` pair for the UE network, and enables proxy ARP on the LAN interface so that DHCP-addressed UEs are reachable on the LAN.

## 2. Add a subscriber

QCore reads subscriber credentials from a `sims.toml` file. Add one entry per SIM, keyed by IMSI, with the `ki` and `opc` that are burnt into the card:

```toml
[imsi-001010123456789]
ki = "<KI hex string>"
opc = "<OPC hex string>"
```

The IMSI's leading digits set the PLMN. `001010123456789` is MCC `001`, MNC `01` (the reserved test PLMN `00101`), which is what this guide uses.

## 3. Start QCore

Start QCore with the PLMN that matches your SIMs, the local IP it binds its interfaces to, and the LAN interface used for DHCP addressing:

```shell
cd ~/qcore
sudo ./target/debug/qcore \
  --mcc 001 --mnc 01 \
  --local-ip 127.0.0.1 \
  --lan-interface-name wlp5s0
```

With `--local-ip 127.0.0.1`, QCore terminates N2 (NGAP over SCTP) on `127.0.0.1:38412`, which is where the co-hosted OCUDU CU-CP connects. To place UEs on a separate NAT'd subnet instead of the LAN, add `--no-dhcp`; QCore then manages the `10.255.0.0/24` space that `setup-routing` prepared.

## 4. Configure and start OCUDU

Install OCUDU using the [OCUDU installation guide](../../../user_manual/installation/installation.md).

Point the CU-CP's AMF connection at QCore's loopback N2 address and port, and use the same PLMN and TAC. The relevant block is:

```yaml
cu_cp:
  amf:
    addrs: 127.0.0.1
    port: 38412
    bind_addrs: 127.0.0.1
    supported_tracking_areas:
      - tac: 1
        plmn_list:
          - plmn: "00101"
            tai_slice_support_list:
              - sst: 1

cell_cfg:
  plmn: "00101"
  tac: 1
```

A complete sample gNB configuration is provided in [`gnb_qcore.yml`](assets/gnb_qcore.yml). It produces an n78 TDD cell at 3600 MHz with 20 MHz bandwidth and 30 kHz SCS, and keeps the RF section generic so you can drop in your own front-end.

Start the gNB:

```shell
sudo ./gnb -c gnb_qcore.yml
```

When the CU-CP connects, QCore logs the NGAP association:

```text
NGAP setup with gNB: ocucp01
```

and OCUDU reports the cell and the AMF connection:

```text
Cell pci=101, bw=20 MHz, 1T1R, dl_arfcn=640000 (n78), dl_freq=3600 MHz, dl_ssb_arfcn=639648, ul_freq=3600 MHz
==== gNB started ===
```

If QCore is restarted, OCUDU re-establishes the NGAP association on its own; the UE needs a reselection (an airplane-mode toggle) to attach again.

## 5. Connect a 5G device

Burn the SIM with the IMSI, KI, and OPc you added to `sims.toml`. Insert it, set the APN to `internet`, and ensure the device is set to 5G Standalone.

The device should register and bring up a PDU session. In DHCP mode its IP is drawn from the host LAN, so it can reach the LAN gateway and the internet directly with no NAT on the core. Confirm with a ping from the device.

:::note
Some handsets request an `ims` DNN that QCore does not serve; this is harmless and the default `internet` PDU session still comes up. On a UE that defaults to non-standalone, forcing NR-only (SA) selection helps it camp on the private cell.
:::

## F1 mode: QCore as the gNB-CU

QCore can also take on the gNB-CU role in addition to the core, exposing F1-C and F1-U instead of N2 and N3. OCUDU then runs as a gNB-DU, using its `odu` application, and F1 carries the split between them. This puts a complete private 5G network, core and CU and DU, on a single node.

Start QCore in F1 mode. In this mode it serves F1-C on SCTP port 38472:

```shell
cd ~/qcore
sudo ./target/debug/qcore --mcc 001 --mnc 01 --local-ip 127.0.0.1 --no-dhcp --f1-mode
```

`--no-dhcp` places UEs on QCore's managed `10.255.0.0/24` subnet with NAT, which `setup-routing` already prepared. QCore logs `My CU F1AP port : 127.0.0.1:38472`.

Point the DU at QCore over F1 and run it with OCUDU's `odu` application. A complete sample is in [`du_qcore_f1.yml`](assets/du_qcore_f1.yml); the F1 part is:

```yaml
f1ap:
  cu_cp_addr: 127.0.0.1    # QCore F1-C (SCTP 38472)
  bind_addr: 127.0.0.2
f1u:
  socket:
    - bind_addr: 127.0.0.2
```

```shell
sudo ./odu -c du_qcore_f1.yml
```

QCore logs the F1 association and the F1 setup from the DU:

```text
F1AP TNLA established with DU 127.0.0.2
F1 setup with DU name:odu0, id:0
```

The UE then registers and brings up a PDU session through the DU and QCore, and reaches the internet over the `10.255.0.0/24` userplane, exactly as it does in NG mode.

## Conclusion

You now have a 5G network running OCUDU against QCore, with a device attached and carrying traffic.

The procedure is not tied to one OCUDU version: QCore has been run against several OCUDU releases, and with srsRAN Project. It works with multiple UEs attached, and with either userplane mode: DHCP addressing on the LAN as shown here, or the NAT'd `10.255.0.0/24` subnet selected with `--no-dhcp`. This guide was verified over a LiteX-M2SDR via SoapySDR, but the core-plane steps are the same for any OCUDU-supported front-end.
