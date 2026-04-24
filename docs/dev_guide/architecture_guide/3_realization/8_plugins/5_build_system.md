# Build System

## Build model

The PHY TAP plugin is compiled as a CMake **OBJECT library** that is linked directly into the OCUDU binary at build time. This avoids shared-library symbol resolution overhead at runtime while still keeping the plugin's source tree in a separate repository that can be developed and version-controlled independently.

A compile definition (`OCUDU_HAS_PHY_TAP`) is set on the OCUDU upper PHY target so that the rest of the build knows the tap is present and can conditionally activate the tap call sites.

## Repository layout

```
my_plugin/
├── CMakeLists.txt                    ← top-level: sets source root, adds subdirectory
├── include/
│   ├── external_ul_processor.h       ← core processing interface (implement this)
│   └── external_processor_factories.h ← factory interface and factory creation declarations
└── lib/
    ├── CMakeLists.txt                ← wires the plugin into ocudu_upper_phy
    ├── phy_tap_factories.cpp         ← exports create_phy_tap_factory()
    ├── phy_tap_impl.h                ← adapter: phy_tap → external_ul_processor
    └── external_processors/
        ├── CMakeLists.txt
        ├── external_processor_factories.cpp  ← factory chain construction
        ├── my_ul_processor_impl.cpp          ← your processor implementation
        └── ...                               ← additional stages / decorators
```

## Top-level CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.14)
project(my_ocudu_plugin)

# Expose the include directory to the lib subtree.
set(OCUDU_PLUGIN_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/include)
add_subdirectory(lib)
```

## lib/CMakeLists.txt

```cmake
# Object library: compiled into OCUDU, not a standalone .so.
add_library(ocudu_phy_tap OBJECT
    phy_tap_factories.cpp)

target_include_directories(ocudu_phy_tap PRIVATE
    ${OCUDU_PLUGIN_INCLUDE_DIR})

target_link_libraries(ocudu_phy_tap
    external_processors)

# Attach the plugin to the OCUDU upper PHY target.
target_link_libraries(ocudu_upper_phy ocudu_phy_tap)

# Tell the rest of the OCUDU build that the tap is active.
target_compile_definitions(ocudu_upper_phy PRIVATE -DOCUDU_HAS_PHY_TAP)

add_subdirectory(external_processors)
```

## lib/external_processors/CMakeLists.txt

```cmake
# All processor implementations go in this library.
add_library(external_processors
    external_processor_factories.cpp
    my_ul_processor_impl.cpp)

target_include_directories(external_processors PRIVATE
    ${OCUDU_PLUGIN_INCLUDE_DIR})

target_link_libraries(external_processors
    my_dsp_library      # any third-party DSP dependency
    zmq                 # only if using the ZMQ telemetry decorator
    ocudu_support)      # OCUDU utility types (span, task_worker, …)
```

## Integrating the plugin into the OCUDU build

The plugin repository is added to the OCUDU source tree via `add_subdirectory()` in the top-level OCUDU `CMakeLists.txt`, typically guarded by a CMake option:

```cmake
option(OCUDU_ENABLE_PHY_TAP "Build the PHY TAP plugin" OFF)

if(OCUDU_ENABLE_PHY_TAP)
  add_subdirectory(path/to/my_plugin)
endif()
```

Build with the plugin enabled:

```bash
cmake -DOCUDU_ENABLE_PHY_TAP=ON ..
make -j$(nproc)
```

## Key points

- **Object library, not shared library.** The plugin is compiled into the binary, not loaded at runtime via `dlopen`. This means it must be present at build time.
- **No ABI boundary.** Because the plugin is an object library, there is no need to manage C symbol visibility or worry about C++ ABI compatibility between the plugin and the main binary.
- **Third-party dependencies** belong in `external_processors`, not in the object library. This keeps the link graph clean and makes it easy to see what the plugin brings in.
- **The `OCUDU_HAS_PHY_TAP` definition** is what gates the call sites inside OCUDU. Without it, the tap code paths are compiled out entirely and have zero runtime cost.
