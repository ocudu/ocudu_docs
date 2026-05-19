---
description: "Configure DPDK kernel-bypass packet I/O for use with a USRP RF front-end and OCUDU."
---

# OCUDU with DPDK on USRP


:::info
This tutorial assumes the machine being used has an Intel processor. For AMD processors, some of the commands (specifically regarding IOMMU and specific DPDK drivers) will change. The overall steps will remain mostly the same.
:::

## Introduction

This tutorial outlines how to configure DPDK for use with OCUDU gNB in a USRP X310.

[DPDK](https://www.dpdk.org/about/), which stands for Data Plane Development Kit, is a set of software libraries and drivers that is used to improve the performance of packet processing in the CU/DU.

Specifically, in the case of OCUDU, this can enable users to achieve higher throughput and a more stable performance with certain configurations. For instance, usecases that require users to run a 100MHz with 2x2 MIMO configuration can greatly benefit from using DPDK.

## Further Reading

- [DPDK Build Guide](https://doc.dpdk.org/guides/linux_gsg/build_dpdk.html)
- [Linux Drivers](https://doc.dpdk.org/guides/linux_gsg/linux_drivers.html)
- [Using Hugepages in a Linux Environment](https://doc.dpdk.org/guides/linux_gsg/sys_reqs.html#use-of-hugepages-in-the-linux-environment)
- [Running Hugepages](https://doc.dpdk.org/guides/tools/hugepages.html)
- [EAL Parameters](https://doc.dpdk.org/guides/linux_gsg/linux_eal_parameters.html)

### Useful Documentation

- [USRP X3x0 Series](https://files.ettus.com/manual/page_usrp_x3x0.html)
- [UHD configuration files (Location)](https://files.ettus.com/manual/page_configfiles.html)
- [Using DPDK in UHD](https://files.ettus.com/manual/page_dpdk.html#dpdk_nic_config)
- [Getting Started with DPDK and UHD](https://kb.ettus.com/Getting_Started_with_DPDK_and_UHD#UHD_4.x)

### Dependencies

There are some specific version requirements, since we're doing a UHD+DPDK+OCUDU setup. The Ubuntu version is `24.04.2 LTS (Noble Numbat)`.

**UHD+DPDK Dependencies**
- UHD 3.x requires DPDK 17.11
- UHD 4.0 and 4.1 require DPDK 18.11
- UHD 4.2 to 4.7 can use any version of DPDK from 18.11 to 21.11
- UHD 4.8 to 4.9 can use any version of DPDK from 18.11 to 24.11

**OCUDU+DPDK Dependencies**
- DPDK version >= 22.11

**Tested dependencies:**
- DPDK 22.11 + UHD 4.9.0.0 + OCUDU

---

## Installing DPDK

:::info
In this tutorial we will use `vfio-pci` but you can also use `igb_uio` or `uio_pci_generic`. For more information on the drivers please refer to [this document](https://doc.dpdk.org/guides/linux_gsg/linux_drivers.html).
:::

As mentioned in the DPDK documentation:

> *VFIO kernel is usually present by default in all distributions, however please consult your distributions documentation to make sure that is the case.*

> *To make use of full VFIO functionality, both kernel and BIOS must support and be configured to use IO virtualization (such as Intel® VT-d).*


Please make sure that your system meets the above requirements before continuing. In case your system doesn’t meet the requirements you can continue with the `igb_uio` module,
as described in the [DPDK documentation](https://doc.dpdk.org/guides/linux_gsg/linux_drivers.html).

```bash
sudo apt install build-essential tar wget python3-pip libnuma-dev meson ninja-build python3-pyelftools
```

Following the previously stated dependencies, this tutorial uses version `22.11.0`. It can be installed with the following commands:

```bash
wget https://fast.dpdk.org/rel/dpdk-22.11.tar.xz
tar -xf dpdk-22.11.tar.xz 
cd dpdk-22.11
meson build 
ninja -C build
sudo ninja -C build install 
sudo ldconfig
```

In order to use the `vfio-pci module`, we need to enable IOMMU in the BIOS. This is usually done by default, but should still be checked.
Furthermore, IOMMU needs to be activated in the kernel. Depending on your CPU, you may need to add `intel_iommu=on iommu=pt` for
Intel CPUs or `amd_iommu=on iommu=pt` for AMD CPUs to the `GRUB_CMDLINE_LINUX_DEFAULT` line in `/etc/default/grub`. After this,
update grub and reboot the system:

```bash
sudo update-grub
sudo reboot
```


The next step is to ensure the `vfio-pci` module is loaded correctly. This can be done with the following command:

```bash
sudo modprobe vfio-pci
```

Verify that `vfio-pci` was loaded correctly with the following command:

```bash
sudo dpdk-devbind.py -s
```

You should see an output similar to the following:

```bash
Network devices using DPDK-compatible driver
============================================

Network devices using kernel driver
===================================
0000:02:00.0 'Ethernet Controller X710 for 10GbE SFP+ 1572' if=enp2s0f0np0 drv=i40e unused=vfio-pci *Active*
0000:02:00.1 'Ethernet Controller X710 for 10GbE SFP+ 1572' if=enp2s0f1np1 drv=i40e unused=vfio-pci *Active*
0000:57:00.0 'Ethernet Controller I226-V 125c' if=enp87s0 drv=igc unused=vfio-pci *Active*
0000:58:00.0 'Ethernet Controller I226-LM 125b' if=enp88s0 drv=igc unused=vfio-pci 
0000:59:00.0 'MT7922 802.11ax PCI Express Wireless Network Adapter 0616' if=wlp89s0 drv=mt7921e unused=vfio-pci 
```

`unused=vfio-pci *Active*` confirms that the `vfio_pci` module was loaded correctly.

If the `vfio-pci` module is not present, it can have multiple issues which are out of scope of this tutorial.
Please refer to your OS maintainer’s or CPU vendor’s documentation for more information if this is the case.

You can continue with the `igb_uio` module, as described below if necessary.


:::warning
Only do this if you were unable to correctly load the `vfio_pci` module.
:::

You can install and load `igb_uio` with the following commands:

```bash
git clone http://dpdk.org/git/dpdk-kmods
cd dpdk-kmods/linux/igb_uio
make
sudo modprobe uio # Ensure uio module is loaded
sudo insmod igb_uio.ko
```

Ensure that the module was loaded correctly with the following command:

```bash
lsmod | grep uio
```

You should see an output similar to the following:

```bash
igb_uio               36864  0
uio                   24576  1 igb_uio
```

If the module is not present use `dmesg` to check for potential errors:

```bash
sudo dmesg -T
```

For more information and troubleshooting tips please refer back to the DPDK documentation and that of your OS maintainers.

---

## Installing UHD


UHD 4.9.0.0 must be compiled specifically with the DPDK driver enabled.

```bash
git clone https://github.com/EttusResearch/uhd.git
cd uhd/host 
git checkout v4.9.0.0
mkdir build  
cd build
cmake -DENABLE_DPDK=ON -DENABLE_EXAMPLES=ON -DENABLE_UTILS=ON ../
make -j$(nproc)
sudo make install 
sudo ldconfig
```

For this tutorial we use FPGA Image Flavor XG, making both SFP+ Ports 10 Gigabit. To do this, first make sure your images are up to date.

```bash
uhd_images_downloader
```

And then load the FPGA image:

```bash
sudo uhd_image_loader --args="type=x300,fpga_image=XG" 
```

---

## Configuring DPDK

### Configure Hugepages

DPDK requires `hugepages` to be configured to run correctly. The `dpdk-hugepages.py` helper script can be used to configure this correctly. We tested the use of 8GB of the 1G hugepages for the
gNB running a 2x2 100MHz. If you run more sectors, you will need to increase the amount of hugepages.

```bash
sudo dpdk-hugepages.py -p 1G --setup 8G
```

To make these changes persistent across boot-cycles, run the following:

```bash
sudo mkdir -p /mnt/huge
```

Then add the following line at the end of `/etc/fstab`:

```bash
nodev /mnt/huge hugetlbfs pagesize=1G 0 0
```

and edit this line in `/etc/default/grub`, an example is:

```bash
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash intel_iommu=on iommu=pt hugepagesz=1G hugepages=8 default_hugepagesz=1G"
```

After that, update the grub config and reboot the system:

```bash
sudo update-grub
sudo reboot
```

After reboot verify that the hugepages are configured correctly with the following commands:

```bash
cat /proc/cmdline
cat /proc/meminfo
```

You should see an output similar to the following:

```bash
cat /proc/cmdline

BOOT_IMAGE=/boot/vmlinuz-6.8.0-106-generic root=UUID=5bb3c555-c05a-4c69-9d3e-bd79d4cc53e3 ro quiet splash intel_iommu=on iommu=pt hugepagesz=1G hugepages=8 default_hugepagesz=1G vt.handoff=7

cat /proc/meminfo

[...]
HugePages_Total:        8
HugePages_Free:         8
HugePages_Rsvd:         0
HugePages_Surp:         0
[...]
```

Once the driver and hugepages are set up successfully the desired interface can then be bound to DPDK.

### Binding to DPDK

We use `dpdk-devbind.py` helper script to find interface name and bus ID:

```bash
sudo dpdk-devbind.py -s
```

You should see the following output or similar:

```bash
Network devices using kernel driver
===================================
0000:02:00.0 'Ethernet Controller X710 for 10GbE SFP+ 1572' if=enp2s0f0np0 drv=i40e unused=vfio-pci 
0000:02:00.1 'Ethernet Controller X710 for 10GbE SFP+ 1572' if=enp2s0f1np1 drv=i40e unused=vfio-pci 
0000:57:00.0 'Ethernet Controller I226-V 125c' if=enp87s0 drv=igc unused=vfio-pci *Active*
0000:58:00.0 'Ethernet Controller I226-LM 125b' if=enp88s0 drv=igc unused=vfio-pci 
0000:59:00.0 'MT7922 802.11ax PCI Express Wireless Network Adapter 0616' if=wlp89s0 drv=mt7921e unused=vfio-pci 
```

The network cards we want to use are `Ethernet Controller X710 for 10GbE SFP+ 1572`, port 0 and 1. Interface name `enp2s0f0np0` and `enp2s0f1np1`,
bus ID `0000:02:00.0` and `0000:02:00.1`. The next step is to bind the desired port to `vfio-pci`. Some NICs require deactivating
the interface before binding. Use the following commands to achieve this:

```bash
sudo ifconfig enp2s0f0np0 down
sudo ifconfig enp2s0f1np1 down
sudo dpdk-devbind.py --bind vfio-pci 0000:02:00.0 0000:02:00.1
```


Every Tx/Rx channel consumes around 6Gbps, so two 10Gbps interfaces are required for 100MHz 2x2 MIMO.

To test that the device has been bound successfully the following command can be used:

```bash
sudo dpdk-devbind.py -s
```

You should see the following output, or similar:

```bash
Network devices using DPDK-compatible driver
============================================
0000:02:00.0 'Ethernet Controller X710 for 10GbE SFP+ 1572' drv=vfio-pci unused=i40e
0000:02:00.1 'Ethernet Controller X710 for 10GbE SFP+ 1572' drv=vfio-pci unused=i40e
```

If the bind was successful, the output will show `drv=vfio-pci`.

---

## UHD DPDK Config

Following [UHD documentation](https://files.ettus.com/manual/page_configfiles.html) a `uhd.conf` file is used to configure the interfaces UHD will use with DPDK. Furthermore, this is also needed to provide an IP address to the DPDK interface so that it can reach the USRP.


An example configuration for `uhd.conf` is:
```ini
[use_dpdk=1]
dpdk_mtu=9000
dpdk_corelist=0,4,6
dpdk_num_mbufs=32384
dpdk_num_desc=4096

[dpdk_mac=xx:xx:xx:xx:xx:xx]
dpdk_ipv4=192.168.40.1/24
dpdk_lcore=4

[dpdk_mac=xx:xx:xx:xx:xx:xx]
dpdk_ipv4=192.168.30.1/24
dpdk_lcore=6
```
* `dpdk_num_desc=4096` maximizes the hardware ring buffer for the X710. The `dpdk_num_mbufs` value can be decreased if facing hardware constraints, maintain power of 2 values. Consider a `dpdk_num_mbufs` value greater than `dpdk_num_desc`.

* `dpdk_corelist`: the used CPUs are arbitrary, just be sure to use even numbers to have full leverage of CPU pairs. 

* `dpdk_mac`: MAC address of the interfaces where you want to use DPDK, for this tutorial `enp2s0f0np0` and `enp2s0f1np1`. 

Now that DPDK is configured, and before starting the gNB, you should make sure that USRP can be found with DPDK and that benchamrks can run clean (no lates, underflows, or overflows).

Use the `uhd_find_devices` command, you should specifie the ip address of the USRP.

```bash
sudo uhd_find_devices --args="use_dpdk=1,type=x300,addr=192.168.30.2,second_addr=192.168.40.2"
```

The ouptut should be similar to this:

```bash
[INFO] [UHD] linux; GNU C++ version 13.3.0; Boost_108300; DPDK_22.11; UHD_4.9.0.HEAD-0-g006d7f76
EAL: Detected CPU lcores: 20
EAL: Detected NUMA nodes: 1
EAL: Detected shared linkage of DPDK
EAL: Multi-process socket /var/run/dpdk/rte/mp_socket
EAL: Selected IOVA mode 'VA'
EAL: VFIO support initialized
EAL: Using IOMMU type 1 (Type 1)
EAL: Ignore mapping IO port bar(1)
EAL: Ignore mapping IO port bar(4)
EAL: Probe PCI driver: net_i40e (8086:1572) device: 0000:02:00.0 (socket -1)
EAL: Ignore mapping IO port bar(1)
EAL: Ignore mapping IO port bar(4)
EAL: Probe PCI driver: net_i40e (8086:1572) device: 0000:02:00.1 (socket -1)
TELEMETRY: No legacy callbacks, legacy socket not created
--------------------------------------------------
-- UHD Device 0
--------------------------------------------------
Device Address:
    serial: 347CB97
    addr: 192.168.30.2
    fpga: XG
    name: 
    product: X310
    type: x300
```

:::info
Note once agian that the fpga image `XG` is specified. The default image for USRP X310 uses a 10GbE and a 1GbE SFP+ ports, while the `XG` image uses 10GB on both SFP+ ports.
:::

Now run the benchmark to verify that UHD can sustain the data rate, in `uhd/examples`, with the duration of 60 seconds:

```bash
sudo ./benchmark_rate --tx_rate=184.32e6 --rx_rate=184.32e6 --tx_channels=0,1 --rx_channels=0,1 --args="use_dpdk=1,type=x300,addr=192.168.30.2,second_addr=192.168.40.2,master_clock_rate=184.32e6,num_recv_frames=8000,num_send_frames=8000" --duration 60

```

A succesful benchmark rate summary should look like this:

```bash
Benchmark rate summary:
  Num received samples:     22192032614
  Num dropped samples:      0
  Num overruns detected:    0
  Num transmitted samples:  22150390440
  Num sequence errors (Tx): 0
  Num sequence errors (Rx): 0
  Num underruns detected:   0
  Num late commands:        0
  Num timeouts (Tx):        0
  Num timeouts (Rx):        0
```
---

## Running OCUDU with DPDK


Once DPDK has been installed and configured you will need to create a clean build of OCUDU to enable the use of DPDK.

If you have not done so already, download the code-base with the following command:

```bash
git clone https://gitlab.com/ocudu/ocudu.git
```

Then build the code-base, making sure to include the correct flags when running cmake:

```bash
cd ocudu
mkdir build
cd build
cmake -DENABLE_DPDK=True -DASSERT_LEVEL=MINIMAL ..
```
An example output for the `cmake`, to verify that DPDK module is correctily found:

```bash
-- Checking for module 'libdpdk>=22.11'
--   Found libdpdk, version 22.11.0
-- DPDK LIBRARIES: -Wl,--as-needed-L/usr/local/lib/x86_64-linux-gnu-lrte_node-lrte_graph-lrte_pipeline-lrte_table-lrte_pdump-lrte_port-lrte_fib-lrte_ipsec-lrte_vhost-lrte_stack-lrte_security-lrte_sched-lrte_reorder-lrte_rib-lrte_dmadev-lrte_regexdev-lrte_rawdev-lrte_power-lrte_pcapng-lrte_member-lrte_lpm-lrte_latencystats-lrte_jobstats-lrte_ip_frag-lrte_gso-lrte_gro-lrte_gpudev-lrte_eventdev-lrte_efd-lrte_distributor-lrte_cryptodev-lrte_compressdev-lrte_cfgfile-lrte_bpf-lrte_bitratestats-lrte_bbdev-lrte_acl-lrte_timer-lrte_hash-lrte_metrics-lrte_cmdline-lrte_pci-lrte_ethdev-lrte_meter-lrte_net-lrte_mbuf-lrte_mempool-lrte_rcu-lrte_ring-lrte_eal-lrte_telemetry-lrte_kvargs-L/usr/lib/x86_64-linux-gnu-lbsd
-- DPDK INCLUDE DIRS: /usr/local/include;/usr/include/x86_64-linux-gnu;/usr/include;/usr/include/libnl3
```

Then continue the build:

```bash
make -j $(nproc)
make test -j $(nproc)
```


### gNB configuration file

The configuration of the `ru_sdr` will require the `use_dpdk=1` flag, which will trigger the configuration file `uhd.conf`. Device discovery via DPDK is not currently implemented, so the device args *mgmt_addr*, *addr*, and *second_addr* (if applicable) must all be specified at runtime.

USRP X310 does not possess a *mgmt_addr* so it is not specified, in the case of N310 USRP use the RJ45 port.

```yaml
ru_sdr:
  device_driver: uhd
  device_args: type=x300,addr=192.168.30.2,second_addr=192.168.40.2,use_dpdk=1
  clock: internal
  sync: internal
  srate: 184.32 
  tx_gain: 30
  rx_gain: 26
```


```yaml
cell_cfg:
  dl_arfcn: 660000 # change according to your setup
  band: 77 # change according to your setup
  channel_bandwidth_MHz: 100
  common_scs: 30
  plmn: "00101"
  tac: 1
  pci: 1
  nof_antennas_ul: 1 
  nof_antennas_dl: 2
  pdsch:
    mcs_table: qam256
  pusch:
    mcs_table: qam64
```    

Before running OCUDU, it is recommended to run gNB in test mode to guarantee  the gNB configuration can be sustained with maximum PDSCH and PUSCH load.

Errors and warnings can be checked with the command:

```bash
tail -f /tmp/gnb.log | grep -E "\[E|W\]"
```

If everything is running correctly you should see the following console output:

```bash
--== OCUDU gNB (commit a540ec6878) ==--

Lower PHY in triple executor mode.
Available radio types: uhd and zmq.
[INFO] [UHD] linux; GNU C++ version 13.3.0; Boost_108300; DPDK_22.11; UHD_4.9.0.HEAD-0-g006d7f76
[INFO] [LOGGING] Fastpath logging disabled at runtime.
Making USRP object with args 'type=x300,addr=192.168.30.2,second_addr=192.168.40.2,use_dpdk=1,master_clock_rate=184.32e6,send_frame_size=8000,recv_frame_size=8000'
EAL: Detected CPU lcores: 20
EAL: Detected NUMA nodes: 1
EAL: Detected shared linkage of DPDK
EAL: Multi-process socket /var/run/dpdk/rte/mp_socket
EAL: Selected IOVA mode 'VA'
EAL: VFIO support initialized
EAL: Using IOMMU type 1 (Type 1)
EAL: Ignore mapping IO port bar(1)
EAL: Ignore mapping IO port bar(4)
EAL: Probe PCI driver: net_i40e (8086:1572) device: 0000:02:00.0 (socket -1)
EAL: Ignore mapping IO port bar(1)
EAL: Ignore mapping IO port bar(4)
EAL: Probe PCI driver: net_i40e (8086:1572) device: 0000:02:00.1 (socket -1)
TELEMETRY: No legacy callbacks, legacy socket not created
[INFO] [X300] X300 initialization sequence...
[INFO] [X300] Maximum frame size: 8000 bytes.
[INFO] [X300] Maximum frame size: 8000 bytes.
[INFO] [X300] Radio 1x clock: 184.32 MHz
[INFO] [MULTI_USRP]     1) catch time transition at pps edge
[INFO] [MULTI_USRP]     2) set times next pps (synchronously)
[WARNING] [0/Radio\#1] Attempting to set tick rate to 0. Skipping.
[WARNING] [0/Radio\#0] Attempting to set tick rate to 0. Skipping.
Cell pci=1, bw=100 MHz, 2T1R, dl_arfcn=660000 (n77), dl_freq=3900 MHz, dl_ssb_arfcn=657312, ul_freq=3900 MHz

N2: Connection to AMF on 10.0.23.62:38412 completed
==== gNB started ===
```

The first lines beginning with `EAL` tell us that the CU/DU is successfully running with DPDK, specifically the third line which reads `Detected shared linkage of DPDK`.


---

## Misc Links

- [Real-time failure in RF](https://github.com/srsran/srsRAN_Project/issues/1141)
- [mbuf alloc](https://stackoverflow.com/questions/79340426/rx-mbuf-alloc-failed-queue-id-0-when-trying-to-use-dpdk-with-uhd)
