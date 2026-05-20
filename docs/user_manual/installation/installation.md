---
description: Install OCUDU from source on Linux, including hardware drivers and required library dependencies.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Installation

To download and build OCUDU:

1. Install dependencies
2. Install RF driver (only required for Split 8 deployments)
3. Clone the repository
4. Build the codebase

---

:::note
OCUDU requires a Linux-based OS with realtime kernel support.
:::

:::tip Coming from srsRAN Project?
Complete this installation first, then follow the [Migration Guide](/migration/) to port your existing srsRAN Project modifications to OCUDU.
:::

## Build Tools and Dependencies

OCUDU uses CMake and C++17. Recommended build tools:

- [cmake](https://cmake.org/)
- [gcc](https://gcc.gnu.org/) (v15.2.0 or later) **OR** [Clang](https://clang.llvm.org/) (v14.0.0 or later)

OCUDU requires these dependencies:

- [libsctp](https://github.com/sctp/lksctp-tools)
- [yaml-cpp](https://github.com/jbeder/yaml-cpp)
- [mbedTLS](https://www.trustedfirmware.org/projects/mbed-tls/)
- [A FFT library](#fft-library)
- Optional requirement: [googletest](https://github.com/google/googletest/)
  - GoogleTest is only mandatory when building with tests. You can enable test building by using the cmake option -DBUILD_TESTING=On.

Install build tools and dependencies:

<Tabs>
  <TabItem value="ubuntu" label="Ubuntu 22.04 (or later)" default>
```bash
sudo apt-get install cmake make gcc g++ pkg-config libmbedtls-dev libsctp-dev libyaml-cpp-dev libgtest-dev
```
  </TabItem>
  <TabItem value="fedora" label="Fedora">
```bash
sudo yum install cmake make gcc gcc-c++ lksctp-tools-devel yaml-cpp-devel mbedtls-devel gtest-devel
```
  </TabItem>
  <TabItem value="arch" label="Arch Linux">
```bash
sudo pacman -S cmake make base-devel mbedtls yaml-cpp lksctp-tools gtest
```
  </TabItem>
</Tabs>

These packages are optional but recommended:

- [Ccache](https://ccache.dev/): This will help to speed up re-compilation
- [backward-cpp](https://github.com/bombela/backward-cpp): This library helps to generate more informative backtraces in the stdout if an error occurs during runtime

---

## FFT Library

OCUDU requires one of the following libraries for FFT calculation:

- [libfftw](https://www.fftw.org/)
- [oneMKL](https://www.intel.com/content/www/us/en/developer/tools/oneapi/onemkl.html)
- [AOCL-FFTZ](https://www.amd.com/en/developer/aocl/fftz.html)
- [Arm Performance Libraries](https://developer.arm.com/Tools%20and%20Software/Arm%20Performance%20Libraries#Downloads)

### libfftw

<Tabs>
  <TabItem value="ubuntu" label="Ubuntu 22.04 (or later)" default>
```bash
sudo apt-get install libfftw3-dev
```
  </TabItem>
  <TabItem value="fedora" label="Fedora">
```bash
sudo yum install fftw-devel
```
  </TabItem>
  <TabItem value="arch" label="Arch Linux">
```bash
sudo pacman -S fftw
```
  </TabItem>
</Tabs>

### oneMKL

<Tabs>
  <TabItem value="ubuntu" label="Ubuntu 22.04 (or later)" default>
```bash
sudo apt update
sudo apt install -y gpg-agent wget
wget -O- https://apt.repos.intel.com/intel-gpg-keys/GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB | gpg --dearmor | sudo tee /usr/share/keyrings/oneapi-archive-keyring.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/oneapi-archive-keyring.gpg] https://apt.repos.intel.com/oneapi all main" | sudo tee /etc/apt/sources.list.d/oneAPI.list
sudo apt update
sudo apt install intel-oneapi-mkl-devel libomp-dev
```
  </TabItem>
</Tabs>

### AOCL-FFTZ

<Tabs>
  <TabItem value="ubuntu" label="Ubuntu 22.04 (or later)" default>
```bash
AOCL_FFTZ_VERSION="5.2"
sudo apt update && sudo apt install -y wget autoconf automake make libtool
cd /tmp
wget --no-check-certificate -O - "https://github.com/amd/aocl-fftz/archive/refs/tags/${AOCL_FFTZ_VERSION}.tar.gz" | tar -xz
cd aocl-fftz-${AOCL_FFTZ_VERSION}
cmake -B buildFFTZ
cmake --build buildFTTZ --target install -j"${nproc}"
```
  </TabItem>
</Tabs>

### ARMPL

<Tabs>
  <TabItem value="ubuntu" label="Ubuntu 22.04 (or later)" default>
```bash
sudo apt update && sudo apt install -y environment-modules wget
cd /tmp
wget https://developer.arm.com/-/cdn-downloads/permalink/Arm-Performance-Libraries/Version_24.10/arm-performance-libraries_24.10_deb_gcc.tar | tar -xz
cd arm-performance-libraries_24.10_deb/
./arm-performance-libraries_24.10_deb.sh --accept
cd ~ && rm -Rf /tmp/arm-performance-libraries_24.10_deb
source /usr/share/modules/init/bash
export MODULEPATH=$MODULEPATH:/opt/arm/modulefiles
module avail
module load armpl/24.10.0_gcc
```
  </TabItem>
</Tabs>

## RF-drivers

:::note
UHD and/or ZMQ are only required for Split 8 deployments, if you are planning on using a Split 7.2 deployment you may skip this step.
:::

OCUDU uses RF drivers to support different radio types. Currently, only UHD and ZMQ are supported:

- [UHD](https://github.com/EttusResearch/uhd) (v4.6.0.0)
- [ZMQ](https://zeromq.org/)

---

## Clone and Build

OCUDU supports several build configurations, controlled via CMake flags. The tabs below cover the available options.

<Tabs>
  <TabItem value="vanilla" label="Vanilla Installation" default>
Clone the OCUDU repository:

```bash
git clone https://gitlab.com/ocudu/ocudu.git
```

Then build the code-base:

```bash
cd ocudu
mkdir build
cd build
cmake ../
make -j $(nproc)
make test -j $(nproc)
```

The binary is at `ocudu/build/apps/gnb/`. To install system-wide:

```bash
sudo make install
```

</TabItem>

<TabItem value="split72" label="Split 7.2 Only Configuration">

:::note
OCUDU allows for compile time selection of a Split 7.2 or Split 8 configuration. By default, OCUDU builds with both options enabled. If you want to compile with the option to have both Split configurations available, follow the "Vanilla" installation guide.
:::

Clone the OCUDU repository:

```bash
git clone https://gitlab.com/ocudu/ocudu.git
```

Then build the code-base, making sure to pass the correct CMake flag:

```bash
cd ocudu
mkdir build
cd build
cmake -DDU_SPLIT_TYPE=SPLIT_7_2 ../
make -j $(nproc)
make test -j $(nproc)
```

The binary is at `ocudu/build/apps/gnb/`. To install system-wide:

```bash
sudo make install
```

</TabItem>

<TabItem value="split8" label="Split 8 Only Configuration">

:::note
OCUDU allows for compile time selection of a Split 7.2 or Split 8 configuration. By default, OCUDU builds with both options enabled. If you want to compile with the option to have both Split configurations available, follow the "Vanilla" installation guide.
:::

Clone the OCUDU repository:

```bash
git clone https://gitlab.com/ocudu/ocudu.git
```

Then build the code-base, making sure to pass the correct CMake flag:

```bash
cd ocudu
mkdir build
cd build
cmake -DDU_SPLIT_TYPE=SPLIT_8  ../
make -j $(nproc)
make test -j $(nproc)
```

The binary is at `ocudu/build/apps/gnb/`. To install system-wide:

```bash
sudo make install
```

</TabItem>

<TabItem value="zmq" label="ZMQ Enabled Installation">
On Ubuntu, ZeroMQ development libraries can be installed with:

```bash
sudo apt-get install libzmq3-dev
```

Alternatively, ZeroMQ can also be built from source.

Install libzmq:

```bash
git clone https://github.com/zeromq/libzmq.git
cd libzmq
./autogen.sh
./configure
make
sudo make install
sudo ldconfig
```

Install czmq:

```bash
git clone https://github.com/zeromq/czmq.git
cd czmq
./autogen.sh
./configure
make
sudo make install
sudo ldconfig
```

With dependencies installed, build OCUDU:

:::warning
If you have already built and installed OCUDU prior to installing ZMQ and other dependencies you will have to re-build to ensure the ZMQ drivers have been recognized correctly.
:::

```bash
git clone https://gitlab.com/ocudu/ocudu.git
cd ocudu
mkdir build
cd build
cmake ../ -DENABLE_EXPORT=ON -DENABLE_ZEROMQ=ON
make -j`nproc`
```

:::note
ZeroMQ is disabled by default, this is enabled when running `cmake` by including `-DENABLE_EXPORT=ON -DENABLE_ZEROMQ=ON`.
:::

Verify ZMQ was detected in the cmake output:

```bash
...
-- FINDING ZEROMQ.
-- Checking for module 'ZeroMQ'
--   No package 'ZeroMQ' found
-- Found libZEROMQ: /usr/local/include, /usr/local/lib/libzmq.so
...
```

</TabItem>

</Tabs>

See [Running OCUDU](../running/running.md) for configuration and next steps.

---

## Vector Tests

Most PHY components, as well as a few components from other layers, are tested by injecting vectors of input data and comparing the results with vectors of expected output data. Since data vectors can be quite heavy, vector tests are not included in the main repository and, instead, are offered as an external plugin that is part of the [OCUDU MATLAB](https://gitlab.com/ocudu/ocudu_elements/ocudu-matlab) companion repository. All the details for installing and running the vector tests are explained in our [MATLAB Testing Tools tutorial](../../tutorials/matlab).
