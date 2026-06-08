# Troubleshooting

For support and help using OCUDU, check out the [issues](https://gitlab.com/ocudu/ocudu/-/issues) section. The OCUDU [issue tracker](https://gitlab.com/ocudu/ocudu/-/issues) is also a rich source of general information.

## What you need

To debug issues in an end-to-end deployment you will need access to most or all of the following:

- RAN components: Core, CU/DU, RU
- A COTS UE (physical or soft)
- A USRP (can substitute for a spectrum analyzer)
- A spectrum analyzer (optional but recommended for RF diagnostics)

From the OCUDU software itself, the most useful diagnostic outputs are:

- **Logs:** set to `info` or `debug` level. See [Outputs](../outputs/outputs.md) for the log format.
- **PCAPs:** per-layer packet captures for MAC, RLC, NGAP, N3, E1AP, F1AP, E2AP.
- **Metrics:** per-layer runtime metrics, viewable via the Grafana GUI.
- **Console trace:** the real-time per-UE trace, activated by pressing `t` while the gNB is running.

To quickly scan a log file for warnings, use:

```bash
cat <logfile> | grep "\[W\]"
```

---

## Performance Tuning

The following sections outline key steps to improve gNB performance.

### CPU Performance Mode

The CPU governor of the PC should be set to performance mode to allow for maximum compute power and throughput. This can be configured for e.g. Ubuntu using:

```bash
echo "performance" | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

It is also recommended that users running on a laptop keep the PC connected to a power-source at all times while running the gNB, as this will avoid performance loss due to CPU frequency scaling on the machine.

### Performance Configuration Script

Before running the gNB application, we recommend tuning your system for best performance. We provide a script to configure known performance parameters:

- [OCUDU performance script](https://gitlab.com/ocudu/ocudu/-/blob/dev/scripts/ocudu_performance?ref_type=heads)

The script does the following:

> 1. Sets the scaling governor to performance
> 2. Disables DRM KMS polling
> 3. Tunes network buffers (Ethernet based USRPs only)

Run the script as follows from the main project folder:

```bash
sudo ./scripts/ocudu_performance
```

---

## USRP Configuration

Users should always ensure that the USRP they are using is running over USB 3.0 or ethernet and correctly configured. If UHD is built from source, users will have multiple example applications available in `/usr/lib/uhd/examples/`. User can verify
their USRP is correctly configured by running the `uhd_benchmark` application as follows:

```bash
sudo ./benchmark_rate --rx_rate [rate in Hz] --tx_rate [rate in Hz]
```

More details can be found in [this](https://kb.ettus.com/Verifying_the_Operation_of_the_USRP_Using_UHD_and_GNU_Radio) guide on the [Ettus Knowledge Base](https://kb.ettus.com/Knowledge_Base).

### USRP Time Calibration

Incorrect time calibration of a USRP can lead to preventing the gNB from receiving PRACH transmissions. The TX/RX time calibration adjusts the offset between TX and RX processing chains delay in the USRP. This value varies as a function of sampling
rate, USRP model and UHD version. Users experiencing issues with incorrect time calibration will see a message similar to the following in the logs:

```bash
2023-03-08T08:38:34.130365 [UL-PHY0 ] [I] [ 1001.18] PRACH:  rssi=+0.5dB detected_preambles=[{idx=55 ta=-7.29us power=+85.8dB snr=0.0dB}] t=351.3us
2023-03-08T08:38:34.130377 [FAPI    ] [E] [     0.0] Detected 1 errors in RACH.indication message at slot=1001.18:
   - Property=Timing advance offset in nanoseconds, value=-7291, expected value=[0-2005000]
```

In the above log the PRACH arrived 7.29 us early to the gNB, which at a sampling rate of 23.04 MHz is approximately 168 samples. The TX/RX offset needs to be adjusted to a higher value than this so that the PRACH arrives within the detection window. This
can be done by adding the following to the config file under the `ru_sdr` options:

```yaml
ru_sdr:
   time_alignment_calibration: -170    # This will set an offset of -170 samples
```

In general, a larger negative value is better as it will make sure the PRACH falls within the detection window. The consequence of increasing this too much is that the effective cell size is reduced (this is not important for a lab set up).

By default the `time_alignment_calibration` parameter is set to 0. This means that in most SDR frontends the PRACH will arrive a few samples late within the window. With preamble format 0, there is enough space in the detection window and this does not cause
any problem. However, if you are trying to set up a very large cell, or using different preamble formats, you might want to set a positive `time_alignment_calibration` value such that there is space in the window for UEs far in the cell.

---

## UE Attach Failure

### Try a wired connection first

When debugging a UE attach failure, start with a wired connection if one is available. This removes RF as a variable and isolates the problem to the network stack. COTS UEs such as Quectel modules and UE simulators such as amariUE can be wired directly to the RU.

### Wireless UE placement

If a wired connection is not available, place the UE at an appropriate distance from the antenna:

- **Indoor RUs:** 3 to 5 m from the antenna
- **Outdoor RUs:** at least 5 m from the antenna

Placing the UE too close will saturate the receivers. Ensure there are no reflective objects between the UE and the RU, and that the line of sight is clear.

### Network visible but UE cannot attach

If the UE can see the network but the attach procedure fails, there is likely an authentication issue between the UE and the core, or a PRACH configuration mismatch. Work through the following checks:

1. **Verify UE credentials.** Confirm that the IMSI, Ki, and OPC values are consistent between the SIM and the core network subscriber database.

2. **Verify APN credentials.** Check that the APN configured in the UE matches the APN configured in the core. Any discrepancy, including trailing spaces, will cause attach failure.

3. **Eject and reinsert the SIM.** This resets the UE's connection timers and can resolve attach failures once credentials have been verified.

4. **Check the PRACH configuration.** If the UE still cannot attach, check the gNB log for missing uplink-plane packets. If u-plane packets are absent, the PRACH configuration in the gNB is likely not matching the RU configuration. Verify that the PRACH settings in the gNB reflect those in the RU's configuration.

---

## Connectivity Optimization

Once a UE is attached, use the following steps to verify and optimize throughput if the observed rate is below what is expected for the configured bandwidth.

### Ping test

Ping the UE from the gNB and monitor latency and packet loss. High latency or packet loss generally indicates an RF link problem. Proceed to the UDP tests below to narrow down whether the issue is on the downlink or uplink.

### UDP downlink test

Run a UDP downlink test and monitor the `nok`, `(%)`, and `mcs` columns in the gNB console trace.

- **Low error rate and high MCS:** downlink RF conditions are acceptable.
- **High error rate and fluctuating MCS:** there is an RF link problem. Check the gNB logs for warnings and review the RU KPIs.
- **Low error rate and high MCS, but maximum rate not reached:** check the `dl_bs` field. If it is consistently below 1 Mb, no data is being sent over the N3 interface. Check the core configuration and N3 backhaul traffic.

### UDP uplink test

Run a UDP uplink test and monitor the `nok`, `(%)`, and `mcs` columns in the gNB console trace.

- **Low error rate and high MCS:** uplink RF conditions are acceptable.
- **High error rate and fluctuating MCS:** there is an RF link problem. Check the gNB logs for warnings and review the RU KPIs.
- **Low BLER and high MCS, but maximum rate not reached:** check the `bsr` field. If it is consistently below 300 Kb, the UE is not transmitting data. Use a spectrum analyzer to verify that the UE is producing a physical signal. If no signal is visible, check for physical issues with the UE.

### UDP bidirectional test

Run a bidirectional UDP test to repeat the above checks for both uplink and downlink simultaneously.

---

## Open Fronthaul Issues

### OFH packet drops

OFH packet drops will appear in the gNB logs as warnings similar to the following:

```text
[OFH     ] [W] Detected '1' late downlink C-Plane messages in the transmitter queue for slot '841.6'
[OFH     ] [W] Missed incoming User-Plane PRACH messages for slot '0' and sector#0
```

or:

```text
[OFH     ] [W] Sector#2305618064: dropped received Open Fronthaul message as no uplink slot context was found for slot '59.13', symbol '9' and eAxC '0'
[OFH     ] [W] Sector#2305618064: dropped received Open Fronthaul message as no uplink slot context was found for slot '59.13', symbol '9' and eAxC '1'
```

Work through the following steps to diagnose and fix the drops:

1. **Enable DPDK.** This is recommended for all O-RAN fronthaul deployments and will significantly improve packet processing stability. See the [DPDK tutorial](../../tutorials/dpdk/index.md) for setup instructions.

2. **Check thread usage with `htop`.** Monitor the OCUDU thread pool while the gNB is running.
   - If usage is consistently above 70% and warnings are present, increase the number of threads in the configuration file.
   - If usage is consistently below 30% and warnings are present, decrease the number of threads.

3. **Verify the `ru_ofh` configuration.** Confirm that the MAC addresses and VLAN tags in the `ru_ofh` section of the gNB configuration match those in the RU configuration file exactly.

4. **Verify PTP synchronization.** Check that `ptp4l` and `phc2sys` are running and within acceptable ranges:
   - `ptp4l` rms value should be around 10.
   - `phc2sys` offset should be in the range of -100 to +100.
   Ensure that the RU is locked to the PTP signal; this can be confirmed via the RU logs.

5. **Check compression settings.** Verify that the compression method and compression header settings are consistent across both the DU and RU configurations. A mismatch (for example, static compression header enabled in the RU but not in the DU) will produce similar warnings.

6. **Check the fronthaul switch.** Confirm that the switch is configured correctly, that all physical connections are secure and in the correct ports, and that VLAN tags are configured correctly. Refer to the relevant [switch integration guide](../../integrations/index.md) for your hardware.

7. **Check RU KPIs.** Verify that there are no sustained late or early packets in the RU KPI output. See [RU late or early packets](#ru-late-or-early-packets) below.

### RU late or early packets

The RU KPI output will show packet timing statistics. An example from a Benetel RU:

```text
SAMPLE_TIME   | RX_TOTAL | RX_ON_TIME | RX_EARLY | RX_LATE | RX_ON_TIME_C | RX_EARLY_C | RX_LATE_C | TX_TOTAL
23:27:02.15   | 89447    | 82367      | -0       | 119     | 6320         | -0         | 16        | -0
23:27:03.12   | 89483    | 82956      | -0       | 183     | 6388         | -0         | 4         | -0
23:27:04.27   | 98370    | 85830      | -0       | 26      | 7016         | -0         | -0        | -0
```

One or two intermittent early or late packets are normal. A sustained stream of late or early packets across multiple reporting periods indicates a configuration problem.

**If late or early packets are caused by PTP issues**, check that `ptp4l` and `phc2sys` are running correctly and within the acceptable ranges above. Reboot the RU if issues persist after PTP has been verified.

**If PTP is healthy**, adjust the `t1a_max` and `ta4_max` parameters in the `ru_ofh` section of the gNB configuration:

| Symptom | Action |
|---|---|
| Early packets at the RU | `t1a_max` is too high; reduce it |
| Late packets at the RU | `t1a_max` is too low; increase it |
| Late packets at the DU | Increase `ta4_max` |
| Both early and late at the RU simultaneously | PTP clock is not properly synchronized |

### RU power and DPD saturation

If the RU transmit power is set too high, the Power Amplifier (PA) may reach Digital Pre-distortion (DPD) saturation. This causes the output signal to be distorted, which typically results in reduced UE throughput or an inability to connect to the network.

To diagnose this, refer to your RU's documentation to verify whether DPD saturation is occurring. If it is confirmed via the RU's own monitoring outputs, lower the `iq_scaling` parameter in the `ru_ofh` section of the gNB configuration file. Only adjust this value if you have confirmed that DPD saturation is the issue. If the problem persists after adjusting the parameter, consult your RU manufacturer's documentation.
