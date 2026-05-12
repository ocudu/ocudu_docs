# OCUDU with DPDK

:::info
This tutorial assumes the machine being used has an Intel processor. For AMD processors some of the commands used will change. The overall steps will remain mostly the same.
:::

## Introduction

This tutorial outlines how to configure DPDK for use with OCUDU for front-haul connectivity.

[DPDK](https://www.dpdk.org/about/), which stands for Data Plane Development Kit, is a set of software libraries and drivers that is used to improve the performance of packet processing in the CU/DU.

Specifically, in the case of OCUDU, this can enable users to achieve higher throughput and a more stable performance with certain configurations. For instance, usecases that require users to
run an O-RU in a 4x4 MIMO configuration can greatly benefit from using DPDK.

### Further Reading

- [DPDK Build Guide](https://doc.dpdk.org/guides/linux_gsg/build_dpdk.html)
- [Linux Drivers](https://doc.dpdk.org/guides/linux_gsg/linux_drivers.html)
- [Using Hugepages in a Linux Environment](https://doc.dpdk.org/guides/linux_gsg/sys_reqs.html#use-of-hugepages-in-the-linux-environment)
- [Running Hugepages](https://doc.dpdk.org/guides/tools/hugepages.html)
- [EAL Parameters](https://doc.dpdk.org/guides/linux_gsg/linux_eal_parameters.html)

---

## Installing DPDK

:::info
In this tutorial we will use `vfio-pci` but you can
also use `igb_uio` or `uio_pci_generic`. For more information on
the drivers please refer to [this document](https://doc.dpdk.org/guides/linux_gsg/linux_drivers.html).
:::

As mentioned in the DPDK documentation:

> *VFIO kernel is usually present by default in all distributions, however please consult your distributions documentation to make sure that is the case.*

> *To make use of full VFIO functionality, both kernel and BIOS must support and be configured to use IO virtualization (such as Intel® VT-d).*

Please make sure that your system meets the above requirements before continuing. In case your system doesn’t meet the requirements you can continue with the `igb_uio` module,
as described in the [DPDK documentation](https://doc.dpdk.org/guides/linux_gsg/linux_drivers.html).

First install the following requirements:

```bash
sudo apt install build-essential tar wget python3-pip libnuma-dev meson ninja-build python3-pyelftools
```

It is recommended to use the most recent DPDK LTS. At the time of writing the tutorial this has been `25.11.0`. This can be installed with the
following commands:

```bash
wget https://fast.dpdk.org/rel/dpdk-25.11.tar.xz
tar xvf dpdk-25.11.tar.xz dpdk-25.11/
cd dpdk-25.11/
meson setup build
cd build
ninja
sudo meson install
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
sudo ./usertools/dpdk-devbind.py -s
```

You should see an output similar to the following:

```bash
Network devices using DPDK-compatible driver
============================================

Network devices using kernel driver
===================================
0000:01:00.0 '82599ES 10-Gigabit SFI/SFP+ Network Connection 10fb' if=enp1s0f0 drv=ixgbe unused=igb_uio,vfio-pci *Active*
0000:01:00.1 '82599ES 10-Gigabit SFI/SFP+ Network Connection 10fb' if=enp1s0f1 drv=ixgbe unused=igb_uio,vfio-pci *Active*
0000:05:00.0 'Ethernet Controller E810-XXV for SFP 159b' if=enp5s0f0 drv=ice unused=igb_uio,vfio-pci *Active*
0000:05:00.1 'Ethernet Controller E810-XXV for SFP 159b' if=enp5s0f1 drv=ice unused=igb_uio,vfio-pci *Active*
0000:09:00.0 'RTL8125 2.5GbE Controller 8125' if=enp9s0 drv=r8169 unused=igb_uio,vfio-pci
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

For more information and troubleshooting tips please refer to back to the DPDK documentation and that of your OS maintainers.

---

## Configuring DPDK

### Configure Hugepages

DPDK requires `hugepages` to be configured to run correctly. The `dpdk-hugepages.py` helper script can be used to configure this correctly. We recommend to use 2GB of the 2G hugepages for the
CU/DU running a single sector 4x2 100MHz. If you run more sectors, you will need to increase the amount of hugepages.

```bash
sudo ./dpdk-hugepages.py -p 1G --setup 2G
```

To make these changes persistent across boot-cycles, run the following:

```bash
sudo mkdir -p /mnt/huge
```

Then add the following line at the end of `/etc/fstab`:

```bash
nodev /mnt/huge hugetlbfs pagesize=1G 0 0
```

and edit this line in `/etc/default/grub`:

```bash
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash intel_iommu=on iommu=pt hugepagesz=1G hugepages=2 default_hugepagesz=1G"
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

BOOT_IMAGE=/vmlinuz-5.15.0-1082-realtime root=/dev/mapper/ubuntu--vg-ubuntu--lv quiet splash intel_iommu=on iommu=pt hugepagesz=1G hugepages=2 default_hugepagesz=1G

cat /proc/meminfo

[...]
HugePages_Total:       8
HugePages_Free:        8
HugePages_Rsvd:        0
HugePages_Surp:        0
[...]
```

Once the driver and hugepages are set up successfully the desired interface can then be bound to DPDK.

### Binding to DPDK

We use `dpdk-devbind.py` helper script to find interface name and bus ID:

```bash
sudo ./dpdk-devbind.py -s
```

You should see the following output or similar:

```bash
Network devices using kernel driver
===================================
0000:01:00.0 82599ES 10-Gigabit SFI/SFP+ Network Connection 10fb if=enp1s0f0 drv=ixgbe unused=igb_uio,vfio-pci,uio_pci_generic
0000:01:00.1 82599ES 10-Gigabit SFI/SFP+ Network Connection 10fb if=enp1s0f1 drv=ixgbe unused=igb_uio,vfio-pci,uio_pci_generic
0000:03:00.0 RTL8111/8168/8411 PCI Express Gigabit Ethernet Controller 8168 if=enp3s0 drv=r8169 unused=igb_uio,vfio-pci,uio_pci_generic *Active*
```

The network card we want to use is `82599ES 10-Gigabit SFI/SFP+ Network Connection`, port 1. Interface name `enp1s0f1`,
bus ID `0000:01:00.1`. The next step is to bind the desired port to `vfio-pci`. Some NICs require deactivating
the interface before binding. Use the following commands to achieve this:

```bash
sudo ifconfig enp1s0f1 down
sudo ./dpdk-devbind.py --bind vfio-pci 0000:01:00.1
```

To test that the device has been bound successfully the following command can be used:

```bash
sudo ./dpdk-devbind.py -s
```

You should see the following output, or similar:

```bash
Network devices using DPDK-compatible driver
============================================
0000:01:00.1 82599ES 10-Gigabit SFI/SFP+ Network Connection 10fb if=enp1s0f1 drv=vfio-pci unused=igb_uio,uio_pci_generic,ixgbe
```

If the bind was successful, the output will show `drv=vfio-pci`.

### EAL Parameters

EAL (Environmental Abstraction Layer) Parameters are used in DPDK to provide a set of functions and abstractions for common environment-related tasks such as memory allocation, thread
management, and initialization. The DPDK documentation covers EAL parameters [here](https://doc.dpdk.org/guides/linux_gsg/linux_eal_parameters.html).

In the context of OCUDU we use the `eal_args` parameter in the configuration file to instruct DPDK which cores to use for certain processes. If not configured correctly, then the
CU/DU will not exploit the improvements in performance that comes with using DPDK. This is because DPDK will only see a single core and will not be able to run concurrent processes correctly.

The EAL parameters, as defined in the above document, are simply passed as as argument to the `eal_args` in the CU/DU config. Any of the parameters mentioned in the document can be set in
this way.

An example configuration is as follows:

```default
hal:
   eal_args: "--lcores '(0-1)@(0-23)'"
```

This will tell DPDK that EAL threads [0 - 1] should use cores [0 - 23]. This is assuming the CU/DU is running on a machine with 24 cores.

Another example is:

```default
hal:
   eal_args: "--lcores (0-1)@(0-23) -a 0000:52:00.0"
```

This configuration tells DPDK that EAL threads [0 - 1] should use cores [0 - 23] for the device bound to the address [0000:52:00.0].

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
make -j $(nproc)
make test -j $(nproc)
```

You can now run OCUDU as normal. If everything is running correctly you should see the following console output:

```bash
EAL: Detected CPU lcores: 24
EAL: Detected NUMA nodes: 1
EAL: Detected shared linkage of DPDK
EAL: Multi-process socket /var/run/dpdk/rte/mp_socket
EAL: Selected IOVA mode 'VA'
EAL: VFIO support initialized
EAL: Using IOMMU type 1 (Type 1)
EAL: Probe PCI driver: net_bnxt (14e4:1751) device: 0000:18:00.2 (socket 0)
TELEMETRY: No legacy callbacks, legacy socket not created

--== OCUDU gNB (commit ) ==--

Connecting to AMF on 192.168.20.100:38412
Initializing the Open FrontHaul Interface for sector#0: ul_compr=[BFP,9], dl_compr=[BFP,9], prach_compr=[BFP,9] prach_cp_enabled=true, downlink_broadcast=false.
Cell pci=1, bw=100 MHz, dl_arfcn=625000 (n78), dl_freq=3375.0 MHz, dl_ssb_arfcn=622272, ul_freq=3375.0 MHz

==== gNodeB started ===
Type <t> to view trace
```

The first lines beginning with `EAL` tell us that the CU/DU is successfully running with DPDK, specifically the third line which reads `Detected shared linkage of DPDK`.
