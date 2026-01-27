# Installation Guide

The following steps need to be taken in order to download and build srsRAN Project:

1. Install dependencies
2. Install RF driver (only required for Split 8 deployments)
3. Clone the repository
4. Build the codebase


---

#### NOTE
srsRAN Project requires a Linux-based OS, we recommend Ubuntu (22.04 or later).


## Build Tools and Dependencies

srsRAN Project uses CMake and C++17. We recommend the following build tools:

- [cmake](https://cmake.org/)
- [gcc](https://gcc.gnu.org/) (v11.4.0 or later) **OR** [Clang](https://clang.llvm.org/) (v14.0.0 or later)

srsRAN Project has the following necessary dependencies:

- [libfftw](https://www.fftw.org/)
- [libsctp](https://github.com/sctp/lksctp-tools)
- [yaml-cpp](https://github.com/jbeder/yaml-cpp)
- [mbedTLS](https://www.trustedfirmware.org/projects/mbed-tls/)
- [googletest](https://github.com/google/googletest/)

You can install the required build tools and dependencies for various distributions as follows:

Ubuntu 22.04 (or later)

```bash
sudo apt-get install cmake make gcc g++ pkg-config libfftw3-dev libmbedtls-dev libsctp-dev libyaml-cpp-dev libgtest-dev
```

Fedora

```bash
sudo yum install cmake make gcc gcc-c++ fftw-devel lksctp-tools-devel yaml-cpp-devel mbedtls-devel gtest-devel
```

Arch Linux

```bash
sudo pacman -S cmake make base-devel fftw mbedtls yaml-cpp lksctp-tools gtest
```

It is also recommended users install the following (although they are not required):

- [Ccache](https://ccache.dev/): This will help to speed up re-compilation
- [backward-cpp](https://github.com/bombela/backward-cpp): This library helps to generate more informative backtraces in the stdout if an error occurs during runtime

---

## RF-drivers

#### NOTE
UHD and/or ZMQ are only required for Split 8 deployments, if you are planning on using a Split 7.2 deployment you may skip this step.

srsRAN Project uses RF drivers to support different radio types. Currently, only UHD and ZMQ are supported:

* [UHD](https://github.com/EttusResearch/uhd) (We recommended the LTS version of UHD, i.e. either 3.15 or 4.0.)
* [ZMQ](https://zeromq.org/)

---


## Clone and Build

srsRAN Project can be built with certain features enabled or disabled. This is done during the build process by using CMake flags and/or by downloading third party dependencies prior to building the code. The following sections outline these various build options.

Vanilla Installation

First, clone srsRAN Project repository:

```bash
git clone https://github.com/srsRAN/srsRAN_Project.git
```

Then build the code-base:

```bash
cd srsRAN_Project
mkdir build
cd build
cmake ../
make -j $(nproc)
make test -j $(nproc)
```

You can now run the gNB from `srsRAN_Project/build/apps/gnb/`. If you wish to install srsRAN Project, you can use the following command:

```bash
sudo make install
```

First, clone srsRAN Project repository:

```bash
git clone https://github.com/srsRAN/srsRAN_Project.git
```

Then build the code-base:

```bash
cd srsRAN_Project
mkdir build
cd build
cmake ../
make -j $(nproc)
make test -j $(nproc)
```

You can now run the gNB from `srsRAN_Project/build/apps/gnb/`. If you wish to install srsRAN Project, you can use the following command:

```bash
sudo make install
```

Split 7.2 Only Configuration

#### NOTE
srsRAN Project allows for compile time selection of a Split 7.2 or Split 8 configuration. By default, srsRAN Project builds with both options enabled. If you want to compile with the option to have both Split configurations available, follow the “Vanilla” installation guide.

First, clone srsRAN Project repository:

```bash
git clone https://github.com/srsRAN/srsRAN_Project.git
```

Then build the code-base, making sure to pass the correct CMake flag:

```bash
cd srsRAN_Project
mkdir build
cd build
cmake -DDU_SPLIT_TYPE=SPLIT_7_2  ../
make -j $(nproc)
make test -j $(nproc)
```

You can now run the gNB from `srsRAN_Project/build/apps/gnb/`. If you wish to install srsRAN Project, you can use the following command:

```bash
sudo make install
```

#### NOTE
srsRAN Project allows for compile time selection of a Split 7.2 or Split 8 configuration. By default, srsRAN Project builds with both options enabled. If you want to compile with the option to have both Split configurations available, follow the “Vanilla” installation guide.

First, clone srsRAN Project repository:

```bash
git clone https://github.com/srsRAN/srsRAN_Project.git
```

Then build the code-base, making sure to pass the correct CMake flag:

```bash
cd srsRAN_Project
mkdir build
cd build
cmake -DDU_SPLIT_TYPE=SPLIT_7_2  ../
make -j $(nproc)
make test -j $(nproc)
```

You can now run the gNB from `srsRAN_Project/build/apps/gnb/`. If you wish to install srsRAN Project, you can use the following command:

```bash
sudo make install
```

Split 8 Only Configuration

#### NOTE
srsRAN Project allows for compile time selection of a Split 7.2 or Split 8 configuration. By default, srsRAN Project builds with both options enabled. If you want to compile with the option to have both Split configurations available, follow the “Vanilla” installation guide.

First, clone srsRAN Project repository:

```bash
git clone https://github.com/srsRAN/srsRAN_Project.git
```

Then build the code-base, making sure to pass the correct CMake flag:

```bash
cd srsRAN_Project
mkdir build
cd build
cmake -DDU_SPLIT_TYPE=SPLIT_8  ../
make -j $(nproc)
make test -j $(nproc)
```

You can now run the gNB from `srsRAN_Project/build/apps/gnb/`. If you wish to install srsRAN Project, you can use the following command:

```bash
sudo make install
```

#### NOTE
srsRAN Project allows for compile time selection of a Split 7.2 or Split 8 configuration. By default, srsRAN Project builds with both options enabled. If you want to compile with the option to have both Split configurations available, follow the “Vanilla” installation guide.

First, clone srsRAN Project repository:

```bash
git clone https://github.com/srsRAN/srsRAN_Project.git
```

Then build the code-base, making sure to pass the correct CMake flag:

```bash
cd srsRAN_Project
mkdir build
cd build
cmake -DDU_SPLIT_TYPE=SPLIT_8  ../
make -j $(nproc)
make test -j $(nproc)
```

You can now run the gNB from `srsRAN_Project/build/apps/gnb/`. If you wish to install srsRAN Project, you can use the following command:

```bash
sudo make install
```

ZMQ Enabled Installation

On Ubuntu, ZeroMQ development libraries can be installed with:

```default
sudo apt-get install libzmq3-dev
```

Alternatively, ZeroMQ can also be built from source.

First, one needs to install libzmq:

```default
git clone https://github.com/zeromq/libzmq.git
cd libzmq
./autogen.sh
./configure
make
sudo make install
sudo ldconfig
```

Second, install czmq:

```default
git clone https://github.com/zeromq/czmq.git
cd czmq
./autogen.sh
./configure
make
sudo make install
sudo ldconfig
```

Finally, you need to compile srsRAN Project (assuming you have already installed all the required dependencies).

#### NOTE
If you have already built and installed srsRAN Project prior to installing ZMQ and other dependencies you will have to re-build to ensure the ZMQ drivers have been recognized correctly.

The following commands can be used to clone and build from source:

```default
git clone https://github.com/srsran/srsRAN_Project.git
cd srsRAN_Project
mkdir build
cd build
cmake ../ -DENABLE_EXPORT=ON -DENABLE_ZEROMQ=ON
make -j`nproc`
```

#### WARNING
ZeroMQ is disabled by default, this is enabled when running `cmake` by including `-DENABLE_EXPORT=ON -DENABLE_ZEROMQ=ON`.

Pay extra attention to the cmake console output. Make sure you read the following line to ensure ZMQ has been correctly detected by srsRAN:

```default
...
-- FINDING ZEROMQ.
-- Checking for module 'ZeroMQ'
--   No package 'ZeroMQ' found
-- Found libZEROMQ: /usr/local/include, /usr/local/lib/libzmq.so
...
```

On Ubuntu, ZeroMQ development libraries can be installed with:

```default
sudo apt-get install libzmq3-dev
```

Alternatively, ZeroMQ can also be built from source.

First, one needs to install libzmq:

```default
git clone https://github.com/zeromq/libzmq.git
cd libzmq
./autogen.sh
./configure
make
sudo make install
sudo ldconfig
```

Second, install czmq:

```default
git clone https://github.com/zeromq/czmq.git
cd czmq
./autogen.sh
./configure
make
sudo make install
sudo ldconfig
```

Finally, you need to compile srsRAN Project (assuming you have already installed all the required dependencies).

#### NOTE
If you have already built and installed srsRAN Project prior to installing ZMQ and other dependencies you will have to re-build to ensure the ZMQ drivers have been recognized correctly.

The following commands can be used to clone and build from source:

```default
git clone https://github.com/srsran/srsRAN_Project.git
cd srsRAN_Project
mkdir build
cd build
cmake ../ -DENABLE_EXPORT=ON -DENABLE_ZEROMQ=ON
make -j`nproc`
```

#### WARNING
ZeroMQ is disabled by default, this is enabled when running `cmake` by including `-DENABLE_EXPORT=ON -DENABLE_ZEROMQ=ON`.

Pay extra attention to the cmake console output. Make sure you read the following line to ensure ZMQ has been correctly detected by srsRAN:

```default
...
-- FINDING ZEROMQ.
-- Checking for module 'ZeroMQ'
--   No package 'ZeroMQ' found
-- Found libZEROMQ: /usr/local/include, /usr/local/lib/libzmq.so
...
```

The [Running srsRAN](running.md#manual-running) section of the documentation further discusses how to configure and run the gNB application.

---

## Packages

srsRAN Project is available to download directly from packages for various linux distributions. Users looking for a simple installation who do not wish to edit the source code should use the package installation.

Ubuntu

Ubuntu users can download srsRAN Project packages using the following commands:

```bash
sudo add-apt-repository ppa:softwareradiosystems/srsran-project
sudo apt-get update
sudo apt-get install srsran-project -y
```

Arch Linux

Arch Linux users can download srsRAN Project packages using an AUR helper, e.g. ‘yay’, using the following command:

```bash
yay -Sy srsran-project-git
```

This will install the latest version of srsRAN Project from git.

When installed from packages, example configs for srsRAN Project can be found in `/usr/share/srsran`. For info on these config files, see [here](config_ref.md#manual-config-ref)

The application can then be run using:

```bash
sudo gnb -c <config file>
```

---

## PHY testvectors

A number of PHY tests are based on MATLAB generated testvectors. By default, those tests are disabled.
The following steps are required to enable them:

1. Download the latest [PHY testvector set](https://github.com/srsran/srsRAN_Project/releases).
2. Extract the PHY testvectors to their location within the srsRAN working directory:

```bash
tar -xf phy_testvectors.tar -C /path_to_your_local_repository/srsRAN_Project
```

1. Enable the use of the PHY testvectors by regenerating the CMake build system:

```bash
cmake -B build -DUSE_PHY_TESTVECTORS=ON
```

1. Rebuild srsRAN Project.
