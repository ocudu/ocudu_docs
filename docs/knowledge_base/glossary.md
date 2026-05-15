---
description: "Definitions of 5G NR and O-RAN terms used throughout the OCUDU documentation."
hide_table_of_contents: true
displayed_sidebar: knowledgeBaseSidebar
---

# Glossary

Terms and abbreviations used in the OCUDU documentation, covering O-RAN architecture, 5G NR air interface, core network functions, and key identifiers.

<div className="glossary-index">
  {[['#','3'],['A','a'],['B','b'],['C','c'],['D','d'],['E','e'],['F','f'],['G','g'],['H','h'],['I','i'],['K','k'],['L','l'],['M','m'],['N','n'],['O','o'],['P','p'],['Q','q'],['R','r'],['S','s'],['T','t'],['U','u'],['V','v'],['X','x'],['Z','z']].map(([label, anchor]) => (
    <a key={label} href={`#${anchor}`} className="glossary-index__letter">{label}</a>
  ))}
</div>

<div className="glossary-page">

## 3

### 3GPP: 3rd Generation Partnership Project
The international standards body that produces technical specifications for mobile communication systems, including LTE (4G) and NR (5G). OCUDU is implemented to 3GPP Release 17/18 specifications. Each specification is identified by a TS number (e.g., TS 38.212 for NR channel coding).

### 5G: 5th Generation Cellular Network Technology
The fifth generation of mobile network technology, standardized by 3GPP from Release 15 onward. 5G introduces NR as the radio access technology and the 5G Core as the network architecture, offering higher throughput, lower latency, and support for network slicing and massive IoT.

## A

### A1: A1 Interface
The interface between the Non-RT RIC (inside the SMO) and the Near-RT RIC. It carries policy guidance from rApps to xApps, enrichment information, and ML model management messages. This is the channel through which long-term optimization decisions (greater than 1 second) influence the real-time RAN controller.

### AMF: Access and Mobility Management Function
The 5G Core network function that handles UE registration, authentication coordination, paging, and handover signaling. The AMF terminates the N2 interface toward the gNB and the N1 NAS signaling interface toward the UE, and connects to the SMF via N11.

### ARFCN: Absolute Radio Frequency Channel Number
A channel numbering scheme that maps a carrier frequency to an integer. In 5G NR, the variant is called NR-ARFCN and covers the full frequency range in 5 kHz steps. Used in configuration files to specify downlink and uplink carrier frequencies.

### AVX: Advanced Vector Extensions
Intel SIMD instruction set extensions operating on 256-bit registers, introduced with Sandy Bridge processors. OCUDU uses AVX2 and AVX512 intrinsics for accelerated PHY processing including LDPC encoding and decoding, FFT, and channel estimation.

### AWGN: Additive White Gaussian Noise
A channel model that adds white Gaussian noise uniformly across all frequencies. Used as the standard noise model in 5G NR link-level simulations and PHY unit tests.

## B

### Beamforming
A signal processing technique that focuses transmitted or received radio energy in a specific direction by controlling the phase and amplitude across an antenna array. In O-RAN, the O-DU sends beamforming commands to the O-RU via C-plane messages on the Open Fronthaul.

### BFP: Block Floating Point
A lossy compression scheme used in the Open Fronthaul to reduce IQ sample bandwidth. Each block of samples shares a common exponent, and the mantissas are stored at a reduced bit width (typically 9 bits). BFP is the most common compression method used in Split 7.2 deployments with OCUDU.

### BG: Base Graph
One of two LDPC base graphs defined in 3GPP NR (BG1 and BG2). BG1 is used for large transport blocks and high code rates; BG2 is used for small transport blocks and low code rates. The base graph is lifted by a lifting factor Z to produce the full parity-check matrix.

### BLER: Block Error Rate
The fraction of transport blocks that fail CRC verification after decoding. The 5G NR scheduler targets approximately 10% BLER for initial transmissions when selecting an MCS, relying on HARQ retransmissions to correct residual errors.

### BSR: Buffer Status Report
A MAC control element sent by the UE to tell the gNB scheduler how much uplink data is queued in its logical channel buffers. The scheduler uses BSR reports to allocate appropriate UL resources in subsequent slots.

### BWP: Bandwidth Part
A contiguous set of physical resource blocks within a carrier, configured by the gNB with a specific numerology. A UE can have up to four DL and four UL BWPs configured, with one active at a time. BWP switching enables power saving and the coexistence of different numerologies on a single carrier.

## C

### Cell
The basic unit of radio coverage served by a gNB. Each cell has a Physical Cell Identity (PCI), broadcasts system information (MIB, SIB1) on its Synchronization Signal Block, and manages UE connections via RRC.

### CORESET: Control Resource Set
A configured time-frequency region within which the UE monitors PDCCH candidates. A CORESET is defined by a bitmap of 6-PRB groups in frequency and 1–3 symbols in time. CORESET 0 is configured via the MIB and used for initial access before full RRC connection.

### COTS UE: Commercial Off-The-Shelf User Equipment
A standard consumer device (smartphone, tablet, or data modem) used to test a 5G network without custom firmware. COTS UEs require a correctly provisioned test SIM and a gNB configuration that matches the device's supported bands and PLMN.

### CFO: Carrier Frequency Offset
A frequency mismatch between the transmitter and receiver local oscillators, causing a phase ramp in the received signal that degrades demodulation performance. CFO estimation and compensation is performed during time-frequency synchronization in the receiver.

### CQI: Channel Quality Indicator
A 4-bit value reported by the UE indicating the downlink channel quality observed during a measurement period. The gNB scheduler uses the CQI to select a Modulation and Coding Scheme that the UE can receive with at most 10% block error rate.

### CRC: Cyclic Redundancy Check
An error-detection code appended to each transport block. The receiver recomputes the CRC and compares it to the received value; a mismatch (CRC KO) triggers a HARQ retransmission. CRC pass and fail counts are reported in scheduler UE metrics as `ul_nof_ok` and `ul_nof_nok`.

### CSI: Channel State Information
The collection of measurements describing the radio channel from the UE's perspective, including CQI, PMI, and RI. The UE measures and reports CSI to enable the gNB to apply adaptive modulation, rank selection, and beamforming.

### CSI-RS: Channel State Information Reference Signal
A downlink reference signal transmitted by the gNB that the UE uses for channel estimation, CSI reporting, and radio link monitoring. CSI-RS resources are configured per cell and can be used for beam management and mobility measurements.

### C-RNTI: Cell Radio Network Temporary Identifier
A cell-specific 16-bit identifier assigned to a UE after successful random access contention resolution. It is used to address the UE in PDCCH scheduling assignments, HARQ feedback, and MAC control signaling.

## D

### DCI: Downlink Control Information
The control message carried on PDCCH that schedules a UE for downlink or uplink transmission. A DCI format specifies resource allocation, MCS, HARQ process number, redundancy version, and other scheduling parameters.

### DMRS: Demodulation Reference Signal
A reference signal embedded within PDSCH, PUSCH, PUCCH, and PBCH transmissions that the receiver uses for channel estimation and coherent demodulation. DMRS patterns are configurable, and additional DMRS positions can be enabled for high-Doppler channels.

### DPDK: Data Plane Development Kit
A set of software libraries and kernel-bypass drivers that moves packet processing from the OS kernel into userspace, reducing latency and CPU overhead. In OCUDU, DPDK is used to achieve high-throughput, low-jitter Open Fronthaul packet processing, particularly for 4x4 MIMO and wide-bandwidth configurations.

### DRB: Data Radio Bearer
A radio bearer carrying user-plane data. Each DRB is associated with one or more QoS flows via SDAP mapping. DRB configuration (PDCP, RLC, and MAC parameters) is delivered by RRC in RRCSetup or RRCReconfiguration messages.

## E

### E1 Interface
The interface between O-CU-CP and O-CU-UP within a disaggregated O-CU. It carries E1AP messages for bearer context management: setup, modification, and release of data radio bearers. E1 enables independent scaling of the control-plane and user-plane CU functions.

### E2 Interface
The O-RAN interface between the Near-RT RIC and E2 Nodes (O-CU-CP, O-CU-UP, O-DU). xApps use E2 to subscribe to RAN telemetry and issue control actions. Messages are carried via E2AP over SCTP.

### eCPRI: Enhanced Common Public Radio Interface
An Ethernet-based fronthaul transport protocol used in O-RAN between the O-DU and O-RU. It carries C-plane, U-plane, and S-plane data over standard Ethernet infrastructure, enabling lower-cost fronthaul than legacy CPRI while supporting functional splits at higher points.

### EPC: Evolved Packet Core
The 4G LTE core network, consisting of the MME, S-GW, P-GW, and HSS. Referenced in OCUDU documentation in the context of Open5GS, which implements both the EPC and the 5G Core. Not directly used by OCUDU, which connects to a 5G Core via the NG interface.

## F

### F1 Interface
The interface between the O-CU and one or more O-DUs. It splits into F1-C (control plane, carrying F1AP for UE context management) and F1-U (user plane, carrying GTP-U tunnels for data radio bearer traffic). F1 traffic traverses the midhaul transport.

### F1-C: F1 Control Plane Interface
The control-plane portion of F1. Carries F1AP messages for F1 setup, gNB-DU configuration updates, UE context management, and paging distribution. Terminated by the O-CU-CP.

### F1-U: F1 User Plane Interface
The user-plane portion of F1. Carries GTP-U tunnels for DRB user data between the O-CU-UP and O-DU. Part of the midhaul transport.

### FAPI: Functional Application Platform Interface
A Small Cell Forum interface specification defining the API between the MAC scheduler and the PHY layer inside an O-DU. FAPI decouples the scheduler software from PHY hardware or firmware, enabling multi-vendor MAC and lower PHY integration.

### FDD: Frequency Division Duplex
A duplex scheme that uses separate paired frequency bands for uplink and downlink transmissions simultaneously. Used in FR1 paired spectrum bands. Compare with TDD.

### FEC: Forward Error Correction
A class of error-correction techniques that add redundancy to transmitted data so the receiver can detect and correct errors without retransmission. In 5G NR, LDPC codes are used for FEC on data channels (PDSCH, PUSCH) and polar codes on control channels (PDCCH, PBCH).

### FFT: Fast Fourier Transform
The algorithm used in OFDM receivers to convert a time-domain signal into the frequency domain, separating subcarriers. In 5G NR, the FFT is performed in the O-RU (Split 7.2) or in the DU-low (Split 8). OCUDU supports multiple FFT library backends including libfftw, oneMKL, AOCL-FFTZ, and Arm Performance Libraries.

### FR1: Frequency Range 1
The sub-6 GHz frequency range for 5G NR, covering 410 MHz to 7125 MHz. Supports subcarrier spacings of 15, 30, and 60 kHz and channel bandwidths up to 100 MHz. FR1 provides better coverage and building penetration than FR2.

### FR2: Frequency Range 2
The millimetre-wave frequency range for 5G NR, covering 24.25 GHz to 52.6 GHz. Supports subcarrier spacings of 60 and 120 kHz and channel bandwidths up to 400 MHz. FR2 offers very high throughput but shorter range and limited building penetration compared to FR1.

## G

### gNB: Next Generation Node B
The 5G base station providing NR radio access. A gNB connects to UEs via the Uu air interface and to the 5G Core via NG (N2 control, N3 user plane). It can be deployed as a monolithic unit or disaggregated into O-CU and O-DU components.

### GPSDO: GPS-Disciplined Oscillator
A precision frequency reference that locks a local oscillator to GPS timing signals, producing a highly accurate 10 MHz clock and 1PPS output. In OCUDU Split 8 deployments, a GPSDO connected to the USRP ensures the RF carrier frequency is accurate enough for COTS UEs to lock onto the cell.

### GPP: General Purpose Processor
A standard CPU (x86 or ARM) as opposed to dedicated hardware accelerators. OCUDU is designed to run the full gNB stack on a GPP, using SIMD acceleration (AVX2, AVX512, ARM Neon) and optionally DPDK for high-performance deployments.

### GTP-U: GPRS Tunnelling Protocol - User Plane
A UDP-based tunneling protocol used to carry user-plane PDU session data between 5G nodes. GTP-U tunnels are used on N3 (O-CU-UP to UPF), F1-U (O-CU-UP to O-DU), and N9 (UPF to UPF).

## H

### HARQ: Hybrid Automatic Repeat Request
A PHY/MAC-layer retransmission mechanism combining forward error correction with ARQ. When a transport block fails its CRC check, the receiver sends a NACK and the transmitter retransmits. The new transmission is chase-combined or incrementally combined with prior attempts before decoding.

## I

### IMSI: International Mobile Subscriber Identity
A globally unique identifier for a mobile subscriber, stored on the USIM. In 5G, the IMSI is the primary form of SUPI. It is sent in the gNB configuration to match the PLMN and is used in test SIM provisioning when connecting COTS UEs.

### IQ Data
The in-phase and quadrature components of a complex baseband signal representing the amplitude and phase of a radio waveform. In Split 7.2 deployments, compressed IQ data is exchanged between the O-DU and O-RU over the Open Fronthaul using eCPRI.

## K

### KPM: Key Performance Measurement
An O-RAN E2 service model that defines a set of standardized RAN metrics exposed to the Near-RT RIC via the E2 interface. KPM allows xApps to subscribe to performance indicators such as DL/UL PRB usage, number of active UEs, and PDCP throughput.

## L

### LDPC: Low-Density Parity-Check
The channel coding scheme used for data channels (PDSCH and PUSCH) in 5G NR from Release 15 onward. OCUDU includes optimized LDPC encoder and decoder implementations for x86 (AVX2/AVX512) and ARM (Neon) processors to maximize throughput.

### LLS: Lower Layer Split
The O-RAN WG4 term for the functional split between the O-DU and O-RU, equivalent to Split 7.2x. LLS-C refers to the synchronization topology between the DU and RU: LLS-C1 uses the DU as a PTP grandmaster, while LLS-C3 uses an external grandmaster with both DU and RU as clients.

### LLR: Log-Likelihood Ratio
A soft-decision metric output by the demodulator for each received bit, representing the log ratio of the probability the bit is 0 to the probability it is 1. LDPC decoders operate on LLRs from the channel for iterative belief-propagation decoding.

### LTE: Long Term Evolution
The 4G radio access technology standardized by 3GPP from Release 8. LTE introduced OFDMA, MIMO, and an all-IP architecture. Referenced in OCUDU documentation as context for srsRAN migration and NSA versus SA deployment comparisons.

## M

### MAC: Medium Access Control
The Layer-2 sublayer responsible for scheduling (via DCI), HARQ operation, random access, logical channel multiplexing, and DRX. The MAC runs between the UE and O-DU over the Uu interface.

### MCC: Mobile Country Code
A three-digit code identifying the country of a mobile network. Together with the MNC, it forms the PLMN identifier that the UE reads from SIB1 during cell selection and includes in NAS Registration Requests.

### MCS: Modulation and Coding Scheme
A combined index specifying the modulation order (QPSK, 16QAM, 64QAM, 256QAM) and channel coding rate for PDSCH and PUSCH. Selected by the gNB scheduler based on reported CQI. The transport block size is computed from the MCS, the number of PRBs, and the number of MIMO layers.

### MIMO: Multiple-Input Multiple-Output
An antenna technique that uses multiple transmit and receive antennas to increase throughput, coverage, or reliability. In OCUDU, MIMO is configured through the `nof_antennas_dl` and `nof_antennas_ul` parameters; 4x4 MIMO is supported in the current release.

### MNC: Mobile Network Code
A two- or three-digit code that, together with the MCC, uniquely identifies a mobile network. The MCC plus MNC forms the PLMN ID used throughout 5G NAS and RRC signaling.

## N

### NAS: Non-Access Stratum
The protocol layer between the UE and the 5G Core (AMF and SMF) that is transparent to the RAN. NAS carries mobility management (registration, authentication, paging) and session management (PDU session establishment, modification, release) procedures.

### Near-RT RIC: Near Real-Time RAN Intelligent Controller
An O-RAN platform that hosts xApps and performs RAN control functions with a 10 ms to 1 second control loop. It connects to E2 Nodes (O-CU-CP, O-CU-UP, O-DU) via the E2 interface and receives policy guidance from the Non-RT RIC via A1.

### NG Interface
The interface between the gNB (O-CU) and the 5G Core. It splits into NG-C (N2, control plane toward AMF, carrying NGAP) and NG-U (N3, user plane toward UPF, carrying GTP-U). NG traffic traverses the backhaul.

### NGAP: Next Generation Application Protocol
The control-plane protocol on the N2 interface between the O-CU-CP and the AMF. Handles NG setup, initial UE message forwarding, NAS transport, UE context setup and release, paging, and handover signaling.

### NR: New Radio
The 5G radio access technology standardized by 3GPP from Release 15 onward. NR supports flexible numerology, massive MIMO, mmWave (FR2), and sub-6 GHz (FR1) operation.

### NRF: NF Repository Function
A 5G Core function that maintains a registry of all active network function instances and their capabilities. NFs register with the NRF at startup and discover other NFs via NRF queries, enabling service-based discovery.

### NSSAI: Network Slice Selection Assistance Information
A set of S-NSSAIs identifying the network slices requested by a UE or allowed by the network. The UE includes the Requested NSSAI in its Registration Request; the AMF responds with an Allowed NSSAI.

### NTN: Non-Terrestrial Network
A 5G network deployment in which the radio link between the gNB and UE is relayed via a non-terrestrial node, typically a low-Earth orbit (LEO) or geostationary (GEO) satellite. NTN introduces unique propagation delays and Doppler effects that require 3GPP Release 17 enhancements. OCUDU supports NTN GEO deployments in the current release.

### NZP: NonZero Power
A CSI-RS resource type in which the gNB actively transmits on the configured resource elements. NZP-CSI-RS resources are used by the UE for channel estimation, CSI reporting, and beam management. Contrasted with ZP (Zero Power) CSI-RS used for interference measurement.

### Numerology (μ)
The set of OFDM parameters determined by the subcarrier spacing: SCS = 15 × 2^μ kHz where μ runs from 0 to 4. Higher μ gives wider subcarrier spacing, shorter symbol duration, and more slots per subframe, suitable for higher frequencies and lower-latency applications. Numerology is configured per BWP.

## O

### O-CU: O-RAN Central Unit
The O-RAN equivalent of the 3GPP gNB-CU. It hosts RRC and PDCP protocol layers and can be further split into O-CU-CP (control plane) and O-CU-UP (user plane). The O-CU connects to O-DUs via F1, to the 5G Core via NG, and to peer O-CUs via Xn.

### O-CU-CP: O-RAN Central Unit - Control Plane
The control-plane portion of the O-CU. It hosts RRC and control-plane PDCP, terminates F1-C toward O-DU, E1 toward O-CU-UP, and N2 (NGAP) toward the AMF. The O-CU-CP is an E2 Node and connects to the Near-RT RIC via E2.

### O-CU-UP: O-RAN Central Unit - User Plane
The user-plane portion of the O-CU. It hosts SDAP and user-plane PDCP (ciphering, header compression), terminates F1-U toward O-DU, E1 toward O-CU-CP, and N3 toward the UPF. The O-CU-UP is also an E2 Node.

### O-DU: O-RAN Distributed Unit
The O-RAN equivalent of the 3GPP gNB-DU. It hosts RLC, MAC, and upper PHY layers, connects to the O-CU via F1 (midhaul), and connects to the O-RU via the Open Fronthaul (eCPRI). The O-DU is an E2 Node managed via O1.

### O1 Interface
The O-RAN management interface between the SMO and O-RAN managed elements (O-CU-CP, O-CU-UP, O-DU, Near-RT RIC). It carries NETCONF/YANG configuration, VES performance and fault notifications, and software management.

### OFH: Open Fronthaul
See Open Fronthaul. OFH is the abbreviation used in OCUDU configuration files, metrics output, and log messages to refer to the Open Fronthaul library and interface.

### Open Fronthaul
The O-RAN WG4 standardized interface between O-DU and O-RU, transported over eCPRI on Ethernet. It defines the CUS plane (Control, User, Synchronization) for real-time IQ data and scheduling, and the M-plane (Management) using NETCONF/YANG for O-RU configuration. Supports the Split 7.2x functional split.

### O-RAN
The Open Radio Access Network initiative (O-RAN Alliance) defining open, interoperable interfaces for disaggregated RAN. Key interfaces include the Open Fronthaul (O-DU to O-RU), E2 (Near-RT RIC to E2 Nodes), O1 (management), A1 (Non-RT RIC policy), and O2 (O-Cloud management).

### O-RU: O-RAN Radio Unit
The O-RAN radio unit implementing lower PHY (IFFT/FFT, CP addition, precoding) and RF functions. It connects to the O-DU via the Open Fronthaul for CUS-plane and M-plane communication, and may implement AAS or mMIMO capabilities.

## P

### PCI: Physical Cell Identity
A numeric identifier (0–1007) for a 5G NR cell, derived from PSS and SSS within the Synchronization Signal Block. UEs detect the PCI during cell search. The PCI is also used for DMRS sequence generation and neighbor cell differentiation.

### PBCH: Physical Broadcast Channel
The physical channel carrying the Master Information Block (MIB). Transmitted within each SSB alongside PSS and SSS. After detecting the SSB and reading the PBCH, the UE obtains the SFN, PDCCH configuration for SIB1, and other parameters needed to access the cell.

### PCAP: Packet Capture
A file format (and the act of capturing) network traffic at a specific protocol layer. OCUDU can generate PCAPs at the MAC, RLC, NGAP, N3, E1AP, F1AP, and E2AP layers. PCAP files can be analyzed with Wireshark to debug protocol messages and trace call flows.

### PDCCH: Physical Downlink Control Channel
The physical channel carrying Downlink Control Information (DCI). Transmitted in CORESETs within configured Search Spaces. The UE blindly decodes PDCCH candidates to find scheduling assignments, UL grants, and TPC commands addressed to its C-RNTI.

### PDCP: Packet Data Convergence Protocol
A Layer-2 sublayer above RLC providing header compression (ROHC), ciphering, integrity protection, sequence number management, in-order delivery, and duplicate detection. Control-plane PDCP (SRBs) terminates on the O-CU-CP; user-plane PDCP (DRBs) terminates on the O-CU-UP.

### PDSCH: Physical Downlink Shared Channel
The primary downlink data channel, used to carry DRB user data, SIBs, RRC messages, and paging. Scheduled dynamically per slot by the gNB scheduler via DCI on PDCCH.

### PDU Session
An end-to-end association between the UE and a Data Network identified by a DNN. A PDU session provides IP connectivity and may contain one or more QoS flows mapped to DRBs. It is established and released via NAS 5GSM procedures, managed by the SMF, with the UPF anchoring the user plane.

### PHY: Physical Layer
The lowest 5G NR protocol layer, responsible for modulation, channel coding, resource mapping, OFDM waveform generation, beamforming, and frame timing. Communicates with MAC via transport channels and with RF hardware via physical channels.

### PHR: Power Headroom Report
A MAC control element sent by the UE reporting the difference between the configured maximum transmit power and the estimated power needed for the current PUSCH transmission. The gNB uses PHR to avoid over-scheduling uplink resources when the UE is power-limited.

### PLMN: Public Land Mobile Network
A mobile network uniquely identified by a Mobile Country Code (MCC) and Mobile Network Code (MNC). UEs read the PLMN list from SIB1 during cell selection and include the selected PLMN in NAS Registration Requests.

### PRACH: Physical Random Access Channel
The uplink physical channel on which UEs transmit random access preambles (Msg1 in the RACH procedure). PRACH resources and preamble sequences are configured via SIB1 for initial access, or via RRCReconfiguration for handover and dedicated RACH.

### PRB: Physical Resource Block
The basic frequency-domain resource allocation unit: 12 consecutive subcarriers. The number of PRBs per BWP depends on the channel bandwidth and numerology. For example, a 20 MHz channel at 15 kHz subcarrier spacing contains 106 PRBs.

### PTP: Precision Time Protocol
An IEEE 1588 standard for sub-microsecond time synchronization across an Ethernet network. In Split 7.2 deployments, PTP is used to synchronize the O-DU and O-RU to a common timing reference (grandmaster), ensuring correct fronthaul slot timing. O-RAN WG4 defines LLS-C1 and LLS-C3 synchronization topologies using PTP.

### PUCCH: Physical Uplink Control Channel
The uplink physical channel carrying uplink control information: HARQ ACK/NACK feedback, CSI reports (CQI, PMI, RI), and Scheduling Requests. Multiple PUCCH formats cover different payload sizes and time durations.

### PUSCH: Physical Uplink Shared Channel
The primary uplink data channel carrying DRB user data and, when scheduled, multiplexed CSI reports and scheduling requests. Allocated by the gNB scheduler via UL DCI grants; supports HARQ retransmissions.

## Q

### QoS: Quality of Service
The framework for differentiating data flows by traffic class. Each QoS flow has a 5QI that maps to a packet delay budget, packet error rate, priority, and resource type (GBR or non-GBR). The SMF provisions QoS rules on the UPF and delivers QoS configuration to the gNB and UE for DRB setup.

### 5QI: 5G QoS Identifier
A scalar value mapping to a standardized set of QoS characteristics. Pre-defined 5QI values cover GBR flows (e.g., 1 for voice, 2 for video) and non-GBR flows (e.g., 9 for best-effort data). Configured by the SMF and enforced end-to-end.

### QPSK: Quadrature Phase Shift Keying
A modulation scheme that encodes 2 bits per symbol using four phase states. Used in 5G NR for control channels (PDCCH, PUCCH) and as the lowest modulation order for data channels under poor channel conditions. Higher modulation orders (16QAM, 64QAM, 256QAM) are selected as channel quality improves.

## R

### RB: Resource Block
A group of 12 consecutive subcarriers in the frequency domain. Used interchangeably with PRB (Physical Resource Block) in most contexts. The number of RBs in a carrier depends on the channel bandwidth and subcarrier spacing.

### RE: Resource Element
The smallest unit of the 5G NR time-frequency resource grid: one subcarrier in frequency and one OFDM symbol in time. Transport block data, reference signals, and control information are all mapped to specific REs.

### RS: Reference Signal
A known signal sequence transmitted at defined time-frequency locations for channel estimation, synchronization, or measurement. In 5G NR, reference signals include PSS/SSS (cell search), DMRS (demodulation), CSI-RS (channel state measurement), and SRS (uplink sounding).

### RI: Rank Indicator
A CSI report value indicating the number of independent data streams (transmission rank) the channel can support. RI=1 is single-layer; RI greater than 1 enables spatial multiplexing. The gNB uses RI for MIMO rank adaptation.

### RIC: RAN Intelligent Controller
The O-RAN platform that hosts applications for RAN optimization and control. The Near-RT RIC (10 ms to 1 s control loop) hosts xApps and connects to E2 Nodes via the E2 interface. The Non-RT RIC (greater than 1 s) hosts rApps within the SMO and provides A1 policy guidance.

### RLC: Radio Link Control
A Layer-2 sublayer between MAC and PDCP. Supports three modes: TM (Transparent Mode, for broadcast channels), UM (Unacknowledged Mode, for delay-sensitive flows), and AM (Acknowledged Mode, with ARQ retransmission for reliable delivery). The RLC runs between UE and O-DU.

### RNTI: Radio Network Temporary Identifier
A 16-bit identifier used to address UEs or broadcast channels on the air interface. Key types include: C-RNTI (UE-specific scheduling), RA-RNTI (random access response), P-RNTI (paging), and SI-RNTI (system information broadcast).

### RoHC: Robust Header Compression
An IETF header compression framework applied at the PDCP layer to reduce the overhead of IP, UDP, and RTP headers on radio bearers. RoHC is particularly beneficial for voice-over-IP traffic, reducing headers from tens of bytes to as few as 1–3 bytes.

### RSRP: Reference Signal Received Power
A measurement of the average received power of a single resource element carrying a reference signal (SSB or CSI-RS). Reported by the UE and used by the gNB scheduler and mobility algorithms to assess downlink signal strength. RSRP is visible in the OCUDU console trace and in scheduler UE metrics.

### RRC: Radio Resource Control
The control-plane protocol between UE and O-CU-CP. Manages RRC connection establishment and release, bearer configuration, measurement control and reporting, system information broadcast, and paging. RRC terminates on the O-CU-CP.

### RRC_INACTIVE
A 5G NR state (not present in LTE) in which the UE AS context is suspended but retained in both the UE and the last serving gNB. The UE performs cell reselection and can resume quickly without full RRC re-establishment, saving UE battery and reducing signaling overhead.

## S

### SA: Standalone
A 5G deployment mode in which the gNB connects directly to a 5G Core (via NG) without relying on an LTE anchor. OCUDU operates exclusively in SA mode. Contrasted with NSA (Non-Standalone), where a 5G NR carrier is used as an additional carrier alongside an LTE anchor.

### S-NSSAI: Single Network Slice Selection Assistance Information
A single network slice descriptor composed of a Slice/Service Type (SST) and an optional Slice Differentiator (SD). Used to identify and request a specific network slice. The UE includes S-NSSAIs in its NSSAI during registration.

### SCS: Subcarrier Spacing
The frequency separation between adjacent OFDM subcarriers, defined by the numerology: 15 kHz (μ=0), 30 kHz (μ=1), 60 kHz (μ=2), 120 kHz (μ=3). Wider SCS gives shorter symbol duration, which helps mitigate phase noise at higher frequencies and reduces latency.

### SDAP: Service Data Adaptation Protocol
A 5G NR-specific user-plane layer above PDCP. SDAP maps QoS flows to DRBs and adds a 1-byte header containing the QFI and reflective QoS indication bits. It terminates on the O-CU-UP and is absent in LTE.

### SDR: Software-Defined Radio
A radio communication system in which components traditionally implemented in hardware (mixers, filters, modulators) are implemented in software. In OCUDU Split 8 deployments, an SDR device such as a USRP acts as the RF front-end, with the digital baseband processed on the host CPU.

### SCTP: Stream Control Transmission Protocol
A reliable transport protocol used to carry 5G signaling protocols including NGAP, F1AP, E1AP, XnAP, and E2AP. SCTP provides multi-homing, multi-streaming, and message boundary preservation, making it more suitable for RAN signaling than TCP.

### SIB: System Information Block
A container carrying specific categories of cell configuration broadcast by the gNB. SIB1 is always broadcast and contains PLMN identity, cell access restriction, TAC, and RACH configuration. Further SIBs (SIB2 onwards) carry idle-mode parameters, reselection configuration, and neighbor cell lists.

### SINR: Signal-to-Interference-plus-Noise Ratio
The ratio of received signal power to the sum of interference and noise power, measured in dB. In OCUDU console output, PUSCH SINR is reported per UE as the `pusch` metric and indicates uplink link quality.

### SMF: Session Management Function
A 5G Core function managing PDU session lifecycle: selecting a UPF, allocating a UE IP address, provisioning QoS and charging rules, and coordinating session setup with the AMF and PCF. The SMF communicates with the UPF via the N4 interface using PFCP.

### SMO: Service Management and Orchestration
The top-level management and orchestration framework in O-RAN. The SMO houses the Non-RT RIC, manages O-RAN NFs via O1, manages O-Cloud infrastructure via O2, and provides the A1 interface toward the Near-RT RIC.

### Split 7.2 (Lower Layer Split)
The O-RAN functional split between O-DU and O-RU. The O-DU handles upper PHY (channel coding, scrambling, modulation mapping) while the O-RU handles lower PHY (IFFT, CP addition, precoding) and RF. Data is transported over eCPRI on Ethernet. Also called LLS (Lower Layer Split).

### Split 8
A functional split in which the entire PHY layer (both upper and lower) is co-located in the DU, with the O-RU acting as a simple RF front-end. In OCUDU, Split 8 deployments use an SDR device (USRP via UHD, or virtual radio via ZMQ) as the RF interface.

### SRB: Signaling Radio Bearer
A radio bearer carrying RRC and NAS control messages. SRB0 uses RLC TM and carries the initial RRCSetupRequest. SRB1 carries RRC messages before AS security is active. SRB2 carries NAS messages after security is established. SRBs use PDCP AM mode.

### SRS: Sounding Reference Signal
An uplink reference signal transmitted by the UE on PUSCH or dedicated SRS resources, allowing the gNB to estimate the uplink channel. SRS measurements are used for uplink-based beamforming, timing advance estimation, and NR positioning.

### SC: Successive Cancellation
A decoding algorithm for polar codes in which bits are decoded sequentially from most reliable to least reliable, with each decoded bit cancelling its contribution from subsequent decisions. Used in 3GPP NR for decoding polar-coded control channels including PDCCH and PBCH.

### SIMD: Single Instruction, Multiple Data
A parallel processing technique where a single instruction operates simultaneously on multiple data elements using wide registers. OCUDU uses SIMD extensions (SSE, AVX2, AVX512, ARM Neon) to accelerate PHY processing including LDPC decoding, FFT, and channel estimation.

### SNR: Signal-to-Noise Ratio
The ratio of signal power to noise power in dB. Higher SNR allows higher modulation orders and coding rates (higher MCS), increasing throughput. Visible in OCUDU console output as a per-UE link quality indicator.

### SSE: Streaming SIMD Extensions
Intel SIMD instruction set extensions operating on 128-bit registers, introduced with the Pentium III. SSE provides a baseline SIMD capability on x86 platforms that do not support AVX2 or AVX512.

### SSB: Synchronization Signal Block
A periodic transmission containing PSS, SSS, and PBCH. The UE detects SSBs during cell search to synchronize, identify the cell (PCI), and read the MIB. In multi-beam deployments, the gNB sweeps the SSB across different beams in a half-frame burst.

## T

### TA: Tracking Area
A geographic area composed of one or more cells with a common Tracking Area Code (TAC). When a registered UE moves to a new TA not in its Allowed TA list, it initiates a Mobility Registration Update. TAs balance paging overhead against registration signaling load.

### TAC: Tracking Area Code
A 24-bit code identifying a Tracking Area within a PLMN. Broadcast in SIB1. Included in the Tracking Area Identity (TAI) together with the PLMN ID.

### TAI: Tracking Area Identity
The globally unique identifier for a Tracking Area, composed of PLMN ID and TAC. Used in NGAP and NAS signaling for mobility management.

### TDD: Time Division Duplex
A duplex scheme that uses the same frequency band for both uplink and downlink, separated in time by a configurable pattern of DL, UL, and flexible symbols. Used in FR1 unpaired spectrum (e.g., n78 at 3.5 GHz). TDD allows asymmetric UL/DL ratios suited to data-heavy traffic. Compare with FDD.

### TS: Technical Specification
A formal standards document published by 3GPP. Each TS number corresponds to a specific topic (e.g., TS 38.212 covers NR multiplexing and channel coding; TS 38.214 covers physical layer procedures for data). Definitions throughout the OCUDU documentation reference 3GPP TS numbers.

### TTI: Transmission Time Interval
The basic unit of scheduling in the radio access network. In 5G NR, one slot (14 OFDM symbols) is the standard TTI, with mini-slot scheduling (2, 4, or 7 symbols) supported for latency-sensitive applications. TTI duration depends on the numerology.

## U

### UCI: Uplink Control Information
Control data transmitted by the UE in the uplink, including HARQ ACK/NACK feedback, CSI reports (CQI, RI, PMI), and Scheduling Requests. UCI is carried on PUCCH, or multiplexed onto PUSCH when uplink data is simultaneously scheduled.

### UDM: Unified Data Management
A 5G Core function providing subscriber data management and authentication credential generation. The UDM stores long-term keys and generates authentication vectors for the AUSF. It also handles subscription data retrieval requested by the AMF and SMF.

### UE: User Equipment
The terminal device connecting to the 5G network via the air interface (Uu). Examples include smartphones, tablets, and IoT modules. The UE consists of mobile equipment (hardware) and a USIM (subscriber identity module).

### UHD: USRP Hardware Driver
The open-source driver library developed by Ettus Research for interfacing with USRP devices. In OCUDU Split 8 deployments, UHD provides the RF front-end abstraction layer for sample streaming between the host CPU and the USRP hardware.

### UPF: User Plane Function
The 5G Core network function anchoring the user-plane data path. The UPF receives downlink traffic from the Data Network via N6, tunnels it to the O-CU-UP via N3, enforces QoS and charging rules, and performs traffic steering. Controlled by the SMF via N4/PFCP.

### USIM: Universal Subscriber Identity Module
The application on a UICC (SIM card) that stores subscriber credentials including the IMSI, long-term key, and authentication algorithms. The USIM performs the 5G-AKA or EAP-AKA' authentication procedure and generates session keys. Test USIMs (e.g., Sysmocom SJS1, SJA2) are commonly used in OCUDU lab deployments.

### USRP: Universal Software Radio Peripheral
A family of SDR hardware devices manufactured by Ettus Research. In OCUDU Split 8 deployments, a USRP (B200, B210, N310, X410, etc.) serves as the RF front-end, converting between digital baseband samples processed by the gNB software and the over-the-air 5G NR signal.

## V

### VLAN: Virtual Local Area Network
A logical segmentation of an Ethernet network that allows traffic from different services or nodes to be isolated on the same physical infrastructure using VLAN tags (IEEE 802.1Q). In Split 7.2 deployments, VLANs are commonly used to separate Open Fronthaul traffic from management traffic on the fronthaul switch.

## X

### xApp: Near-RT RIC Application
A modular application running on the Near-RT RIC platform with a 10 ms to 1 second control loop. xApps subscribe to E2 telemetry from E2 Nodes (KPM, RAN state) and issue E2 control actions for functions such as traffic steering, handover optimization, and load balancing.

### Xn Interface
The interface between peer gNB instances (O-CU to O-CU). It splits into Xn-C (XnAP, control plane for handover coordination and dual connectivity) and Xn-U (GTP-U, user plane for data forwarding during handover). Xn-based handover is faster than N2-based handover because it does not require AMF involvement in the preparation phase.

## Z

### ZMQ: ZeroMQ
A high-performance asynchronous messaging library used in OCUDU to implement a virtual RF interface. When ZMQ is enabled, the gNB or DU sends and receives baseband IQ samples over ZMQ sockets rather than real hardware, enabling purely software-based testing without a USRP.

</div>
