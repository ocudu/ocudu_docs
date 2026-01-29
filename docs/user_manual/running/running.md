import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Running

:::info
This guide outlines how to *manually* run OCUDU applications in a Split 8 deployment with a USRP. For Split 7.2 deployments and/or Kubernetes execution see [here](../tutorials/index.md).
:::

## Baseline Requirements

To successfully run an end-to-end network OCUDU applications you will need the following:

- A PC with a Linux based OS (Ubuntu 22.04 or later)
- A USRP device
- OCUDU (see the [Installation Guide](../installation/installation.md)
- A 3rd-party 5G core (we recommend [Open5GS](https://github.com/open5gs/open5gs))
- A 3rd-party 5G UE

:::tip
If you plan to connect the gNB to a COTS UE best performance is achieved using an external clock source such as an Octoclock or GPSDO that is compatible with your RF-frontend, as the on-board clock within the USRP may not be accurate enough to enable a connection with the UE.
This is discussed further in the relevant tutorial.
:::

---

## System Preparation

Before running any of OCUDU applications, we recommend tuning your system for best performance. We provide a script to configure known performance parameters:

- [OCUDU performance script](https://gitlab.com/ocudu/ocudu/-/blob/dev/scripts/ocudu_performance?ref_type=heads)

The script does the following:

1. Sets the scaling governor to performance
2. Disables DRM KMS polling
3. Tunes network buffers (Ethernet based USRPs only)

Run the script as follows from the main project folder:

```bash
sudo ./scripts/ocudu_performance
```

---

## Running OCUDU


<Tabs>
  <TabItem value="gnb" label="gNodeB" default>
If OCUDU has been installed using `sudo make install` or installed from packages then you will be able to run the gNB from anywhere on your machine.

If you have built OCUDU from source and have not installed it, then you can run the gNB from: `/ocudu/build/apps/gnb`. In this folder you will find the gNB application binary.

Run the gNB as follows, passing the YAML configuration file:

```bash
sudo ./gnb -c gnb_rf_b200_tdd_n78_10mhz.yml
```

Run the gNB with `sudo` to ensure threads are configured with the correct priority.

Example configuration files can be found in the `configs/` folder in OCUDU codebase. For more information on the configuration files and the available parameters see the [configuration reference](../config_reference/config_ref.md).

When running, the gNB should generate the following console output:

```bash
Available radio types: uhd.

--== OCUDU gNB (commit 77be7d339) ==--

[INFO] [UHD] linux; GNU C++ version 9.4.0; Boost_107100; UHD_4.2.0.HEAD-0-g197cdc4f
Making USRP object with args 'type=b200'
Cell pci=1, bw=10 MHz, dl_arfcn=632628 (n78), dl_freq=3489.42 MHz, dl_ssb_arfcn=632640, ul_freq=3489.42 MHz

==== gNodeB started ===
Type <t> to view trace
```

Entering `t` will enable the console trace, see [here](../outputs/outputs.md) for more details.

Configuration parameters can also be passed on the command line. To see the list of options, use:

```bash
./gnb --help
```

If OCUDU has been installed using `sudo make install` or installed from packages then you will be able to run the gNB from anywhere on your machine.

If you have built OCUDU from source and have not installed it, then you can run the gNB from: `/ocudu/build/apps/gnb`. In this folder you will find the gNB application binary.

Run the gNB as follows, passing the YAML configuration file:

```bash
sudo ./gnb -c gnb_rf_b200_tdd_n78_10mhz.yml
```

Run the gNB with `sudo` to ensure threads are configured with the correct priority.

Example configuration files can be found in the `configs/` folder in OCUDU codebase. For more information on the configuration files and the available parameters see the [configuration reference](../config_reference/config_ref.md).

When running, the gNB should generate the following console output:

```bash
Available radio types: uhd.

--== OCUDU gNB (commit 77be7d339) ==--

[INFO] [UHD] linux; GNU C++ version 9.4.0; Boost_107100; UHD_4.2.0.HEAD-0-g197cdc4f
Making USRP object with args 'type=b200'
Cell pci=1, bw=10 MHz, dl_arfcn=632628 (n78), dl_freq=3489.42 MHz, dl_ssb_arfcn=632640, ul_freq=3489.42 MHz

==== gNodeB started ===
Type <t> to view trace
```

Entering `t` will enable the console trace, see [here](../outputs/outputs.md) for more details.

Configuration parameters can also be passed on the command line. To see the list of options, use:

```bash
./gnb --help
```
  </TabItem>

<TabItem value="odu" label="O-DU">
If OCUDU has been installed using `sudo make install` or installed from packages then you will be able to run DU from anywhere on your machine.

If you have built OCUDU from source and have not installed it, then you can run the DU from: `/ocudu/build/apps/du/odu`. In this folder you will find the DU application binary.

Run the DU as follows, passing the YAML configuration file:

```bash
sudo ./odu -c du.yml
```

Run the DU with `sudo` to ensure threads are configured with the correct priority.

Example configuration files can be found in the `configs/` folder in OCUDU codebase. For more information on the configuration files and the available parameters see the [configuration reference](../config_reference/config_ref.md).

When running, the DU should generate the following console output:

```bash
Cell pci=1, bw=20 MHz, 1T1R, dl_arfcn=650000 (n78), dl_freq=3750.0 MHz, dl_ssb_arfcn=649632, ul_freq=3750.0 MHz

Available radio types: uhd and zmq.
[INFO] [UHD] linux; GNU C++ version 9.3.0; Boost_107100; UHD_4.0.0.0-666-g676c3a37
[INFO] [LOGGING] Fastpath logging disabled at runtime.
Making USRP object with args 'type=b200,num_recv_frames=64,num_send_frames=64'
[INFO] [B200] Detected Device: B210
[INFO] [B200] Operating over USB 3.
[INFO] [B200] Initialize CODEC control...
[INFO] [B200] Initialize Radio control...
[INFO] [B200] Performing register loopback test...
[INFO] [B200] Register loopback test passed
[INFO] [B200] Performing register loopback test...
[INFO] [B200] Register loopback test passed
[INFO] [B200] Setting master clock rate selection to 'automatic'.
[INFO] [B200] Asking for clock rate 16.000000 MHz...
[INFO] [B200] Actually got clock rate 16.000000 MHz.
[INFO] [MULTI_USRP] Setting master clock rate selection to 'manual'.
[INFO] [B200] Asking for clock rate 23.040000 MHz...
[INFO] [B200] Actually got clock rate 23.040000 MHz.
F1-C: Connection to CU-CP on 127.0.10.1:38471 completed

==== DU started ===
Type <h> to view help
```

Entering `t` will enable the console trace, see [here](../config_reference/config_ref.md) for more details.

Configuration parameters can also be passed on the command line. To see the list of options, use:

```bash
./odu --help
```

If OCUDU has been installed using `sudo make install` or installed from packages then you will be able to run the DU from anywhere on your machine.

If you have built OCUDU from source and have not installed it, then you can run the DU from: `/ocudu/build/apps/du`. In this folder you will find the DU application binary.

Run the DU as follows, passing the YAML configuration file:

```bash
sudo ./odu -c du.yml
```

Run the DU with `sudo` to ensure threads are configured with the correct priority.

Example configuration files can be found in the `configs/` folder in OCUDU codebase. For more information on the configuration files and the available parameters see the [configuration reference](../config_reference/config_ref.md).

When running, the DU should generate the following console output:

```bash
Cell pci=1, bw=20 MHz, 1T1R, dl_arfcn=650000 (n78), dl_freq=3750.0 MHz, dl_ssb_arfcn=649632, ul_freq=3750.0 MHz

Available radio types: uhd and zmq.
[INFO] [UHD] linux; GNU C++ version 9.3.0; Boost_107100; UHD_4.0.0.0-666-g676c3a37
[INFO] [LOGGING] Fastpath logging disabled at runtime.
Making USRP object with args 'type=b200,num_recv_frames=64,num_send_frames=64'
[INFO] [B200] Detected Device: B210
[INFO] [B200] Operating over USB 3.
[INFO] [B200] Initialize CODEC control...
[INFO] [B200] Initialize Radio control...
[INFO] [B200] Performing register loopback test...
[INFO] [B200] Register loopback test passed
[INFO] [B200] Performing register loopback test...
[INFO] [B200] Register loopback test passed
[INFO] [B200] Setting master clock rate selection to 'automatic'.
[INFO] [B200] Asking for clock rate 16.000000 MHz...
[INFO] [B200] Actually got clock rate 16.000000 MHz.
[INFO] [MULTI_USRP] Setting master clock rate selection to 'manual'.
[INFO] [B200] Asking for clock rate 23.040000 MHz...
[INFO] [B200] Actually got clock rate 23.040000 MHz.
F1-C: Connection to CU-CP on 127.0.10.1:38471 completed

==== DU started ===
Type <h> to view help
```

Entering `t` will enable the console trace, see [here](../config_reference/config_ref.md) for more details.

Configuration parameters can also be passed on the command line. To see the list of options, use:

```bash
./odu --help
```

</TabItem>

<TabItem value="ocu" label="O-CU">

If OCUDU has been installed using `sudo make install` or installed from packages then you will be able to run the CU from anywhere on your machine.

If you have built OCUDU from source and have not installed it, then you can run the CU from: `/ocudu/build/apps/cu`. In this folder you will find the CU application binary.

Run the CU as follows, passing the YAML configuration file:

```bash
sudo ./ocu -c cu.yml
```

Run the CU with `sudo` to ensure threads are configured with the correct priority.

Example configuration files can be found in the `configs/` folder in OCUDU codebase. For more information on the configuration files and the available parameters see the [configuration reference](../config_reference/config_ref.md).

When running, the CU should generate the following console output:

```bash
N2: Connection to AMF on 127.0.1.100:38412 completed
F1-C: Listening for new connections on 127.0.10.1:38471...

==== CU started ===
Type <h> to view help
```

Configuration parameters can also be passed on the command line. To see the list of options, use:

```bash
./ocu --help
```

If OCUDU has been installed using `sudo make install` or installed from packages then you will be able to run the CU from anywhere on your machine.

If you have built OCUDU from source and have not installed it, then you can run the CU from: `/srsRAN_Project/build/apps/cu`. In this folder you will find the the CU application binary.

Run the CU as follows, passing the YAML configuration file:

```bash
sudo ./ocu -c cu.yml
```

Run the CU with `sudo` to ensure threads are configured with the correct priority.

Example configuration files can be found in the `configs/` folder in OCUDU codebase. For more information on the configuration files and the available parameters see the [configuration reference](../config_reference/config_ref.md).

When running, the CU should generate the following console output:

```bash
N2: Connection to AMF on 127.0.1.100:38412 completed
F1-C: Listening for new connections on 127.0.10.1:38471...

==== CU started ===
Type <h> to view help
```

Configuration parameters can also be passed on the command line. To see the list of options, use:

```bash
./srscu --help
```

</TabItem>

</Tabs>

For more information on running OCUDU, and configuring for various use-cases see the [full list of tutorials](../tutorials/index.md).