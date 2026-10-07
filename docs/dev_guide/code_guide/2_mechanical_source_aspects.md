# Mechanical source aspects

## Source Code Formatting

The OCUDU project uses a defined set of formatting rules, and heavily relies on clang-format for automatic source code formatting.
You must use the custom clang-format file in the root of the repository, see [here](https://clang.llvm.org/docs/ClangFormatStyleOptions.html)
for more information about the options found in this file.

If you are interested in specific rules regarding spaces, maximum width, etc., then please check the contents of the above file.

When adding new commits to the repository, please make sure you have formatted your new changes with clang-format **before** submitting them.

---

## Comments

Comments have to be regarded as an essential part of the code, as they greatly facilitate reviewers’ and maintainers’ tasks. From this perspective, comments
should describe what the code is trying to do and why, without getting into the implementation details at a micro level and, most importantly, targeting an
audience that may not be as familiar as you are with the topic at hand.

The following brief sections provide a very rough introduction to how developers are expected to comment code. A more thorough guide can be found [here](6_self_generating_docs.md).

### Comment Guidelines

- Write comments as English prose, using proper capitalization,
  punctuation, etc., ending them with a period sign. Words are spelled in American
  English, as given by the main entry of [The Merriam-Webster Dictionary](https://www.merriam-webster.com/).

- Comment lines should start with a double slash for *normal* comments
  and with a triple slash for *documentation* comments. The
  double/triple-slash format should be used always, also for multiline comments.

```c++
/// \brief Does something.
///
/// More details about the function.
void some_func(){
  // Now we print a simple text.
  fmt::print("Some comment.");
}
```

- Comments should always start on a new line above the code that is being
  commented. Specifically, documentation comments should precede the class or
  function declarations and not go inside their body. Normal comments cannot be
  placed next to the code or outside the body of a function.

```c++
// Some general comment outside the body of a function - WRONG!

/// Does something. - OK
void some_func(){
  // Now we print a simple text. - OK
  fmt::print("Some comment.");

  fmt::print("Something else."); // Side comment. - WRONG!
}
```

- In cases where indentation is helpful to support the content of the
  comment, the suggested form is to start the line with one or more “greater
  than” (>) signs, depending on the indentation level. For instance, the comments
  in the example below suggest that the PUCCH configuration is a step within the
  UL configuration.

```c++
uplink_config srsran::config_helpers::make_default_ue_uplink_config(const cell_config_builder_params& params)
{
  // > UL configuration.
  uplink_config ul_config{};
  ul_config.init_ul_bwp.pucch_cfg.emplace();

  // >> PUCCH configuration.
  auto& pucch_cfg = ul_config.init_ul_bwp.pucch_cfg.value();

  // ... more code ...
}
```

- C-style comments `/* */` are, in general, not allowed. The only
  exceptions are file headers (see below) and the documentation of parameters in a
  function call (very useful when, e.g., passing a `bool` or a
  `nullptr` as arguments).

```c++
// Hard to see what "true" and "nullptr" actually refer to.
obj.method(a, b, true, nullptr);
// Easy to see what the input values actually do.
obj.method(a, b, /*enable_X=*/true, /*options=*/nullptr);
```

- Merge requests should **not** contain lines of code that have been
  commented out. If you really need to do it for documentation purposes or maybe
  for debug printing, use `#if 0` and `#endif`. These nest
  properly and are better behaved in general than C-style comments.

- Overridden methods are documented in the interface they come from, so do not repeat the documentation block. Instead,
  precede the declaration with the normal comment `// See interface for documentation.`. This tells the reader where to
  look, and avoids keeping two copies of the same documentation that can easily diverge.

```c++
class mac_impl : public mac_interface
{
public:
  // See interface for documentation.
  void handle_rx_data_indication(const mac_rx_data_indication& msg) override;

  // See interface for documentation.
  void handle_crc(const mac_crc_indication_message& msg) override;
};
```

### File Headers

Every source file of the project should have a copyright header and a short description of the basic purpose of the file. The standard header looks like
the example below.

```c++
  /*
 *
 * Copyright 2021-2023 Software Radio Systems Limited
 *
 * This file is part of srsRAN.
 *
 * srsRAN is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * srsRAN is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * A copy of the GNU Affero General Public License can be found in
 * the LICENSE file in the top-level directory of this distribution
 * and at http://www.gnu.org/licenses/.
 *
*/
```

---

## Header Guards

All header files should have an include guard to prevent double inclusion.
The OCUDU codebase uses the `#pragma once` directive, which is widely supported by common compilers.
Unlike conventional include guards (via `#ifndef` and `#define`), neither a unique identifier nor a closing expression (`#endif`) is required.

The following example shows this:

```cpp
/*
 * File header...
 */

#pragma once

#include "foo.h"
#include <file.h>

namespace ocudu {
// ...
} // ocudu
```

---

## #include Style

Try to include a minimal list of `#include` and keep it clean of redundant header files as dependencies change. To that end,
it is OK to exploit the fact that includes propagate transitively. So, if for instance *foo.h* already includes *bar.h*, only
*foo.h* needs to be included when using functions or classes from both files.

The include list should be immediately after the header file comment, and after the include guards if working on a header file.
Include files should be listed in the following order:

1. Main module header.
2. Local and private headers.
3. OCUDU or subproject headers (ocudu/…, etc).
4. System library includes.

Keep each category sorted lexicographically by the full path and avoid adding newlines between categories or include directives.
The main module header should be always the first in the list. Sub-project headers should be included before ocudu headers (from most specific to least specific eg: more specific ocudu subfolders first).

```cpp
#include "my_class_header.h"            // category 1
#include "private_module_utils.h"       // category 2
#include "srsenb/hdr/public_header.h"   // category 3
#include "ocudu/adt/bounded_vector.h"   // category 3
#include <string>                       // category 4
#include <vector>                       // category 4
```

Use C++ library header files in C++ files instead of using the C library headers, eg: `cstring`, `cassert`, `cstdint`, etc.

As a final note, `clang-format` will lexicographically sort all includes files automatically for you.

## Forward declarations

In a header file (`.h`), **if a type is used in a way that does not need its complete definition, forward declare it
instead of including its header**. Include the full header in the `.cpp` file, where the type is actually used.

**Rationale**

- **Faster builds**: every `#include` in a header propagates to every file that includes that header. Fewer includes mean
  less to recompile when something changes.
- **Weaker coupling**: changing a header does not force a rebuild of every file that only mentions the types it defines.
- **No circular dependencies**: two classes that refer to each other cannot include each other's headers. Forward
  declarations break the cycle.
- **Clearer dependencies**: the header shows which types are truly required and which are only referenced.

**Use a forward declaration** when the header only uses `T` as:

- A pointer or reference: `T*`, `T&`, `const T&`, `std::shared_ptr<T>` or `std::weak_ptr<T>`.
- A `std::unique_ptr<T>` member, provided that the destructor of the owning class is defined in the `.cpp` file (where
  `T` is complete).
- A parameter or return type in a function declaration, even by value.
- A `friend` declaration, a `using` alias, or an `extern` declaration.

**Include the header** when the header file:

- Has a member of type `T` held **by value**.
- **Inherits** from `T`.
- Calls methods or reads members of `T`, e.g., in an inline function.
- Uses `sizeof(T)` or creates an instance of `T`.
- Uses a nested type (`T::inner`) or an alias declared in that header.
- Uses an enum of any kind (enum or enum class, with or without a fixed underlying type). Do not forward declare enums:
  include the header that defines them.
- Uses a type from the **standard library** or from a **third-party library**. Forward declaring `std` types is undefined
  behavior, and third-party declarations may change without notice.

List forward declarations right after the includes, **sorted alphabetically, classes first and then structs**. **Do not
forward declare enums**: include the header that defines them.

**Example**

```cpp
// Bad: mac_cell_processor.h

#pragma once

#include "mac_config.h"                // Needed: member held by value.
#include "ocudu/mac/mac_cell_result.h" // Not needed: only used by reference.
#include "ocudu/support/timers.h"      // Not needed: only used through a pointer.
#include "rlc_entity.h"                // Not needed: only held through a unique_ptr.
#include <memory>

namespace ocudu {

class mac_cell_processor
{
public:
  mac_cell_processor(const mac_config& cfg, timer_manager& timers);
  ~mac_cell_processor() = default;

  void handle_slot_result(const mac_cell_result& result);

private:
  mac_config                  cfg;
  timer_manager*              timers;
  std::unique_ptr<rlc_entity> rlc;
};

} // namespace ocudu
```

```cpp
// Good: mac_cell_processor.h

#pragma once

#include "mac_config.h"
#include <memory>

namespace ocudu {

class rlc_entity;
class timer_manager;
struct mac_cell_result;

class mac_cell_processor
{
public:
  mac_cell_processor(const mac_config& cfg, timer_manager& timers);
  // Defined in the .cpp file, where rlc_entity is complete.
  ~mac_cell_processor();

  void handle_slot_result(const mac_cell_result& result);

private:
  mac_config                  cfg;
  timer_manager*              timers;
  std::unique_ptr<rlc_entity> rlc;
};

} // namespace ocudu
```

```cpp
// mac_cell_processor.cpp

#include "mac_cell_processor.h"
#include "rlc_entity.h"
#include "ocudu/mac/mac_cell_result.h"
#include "ocudu/support/timers.h"

using namespace ocudu;

mac_cell_processor::~mac_cell_processor() = default;
```

---

## Language and compiler aspects

### Treat compiler warnings as errors

Avoid submitting code that generates compiler warnings. Sometimes you may get a false positive warning, in this case find a way to suppress it.

### Code Portability

Try to write portable code under all circumstances. If you are under the situation where you need to do something that is not portable,
then put it behind a documented interface so it is centralized in a single place and not scattered in different places.

### Avoid RTTI and Exceptions

In C++ code, **do not** use exceptions or RTTI (runtime type information eg:`dynamic_cast<>`).

### Use of auto

In general, use auto when it makes the code more readable and easier to maintain. Typical cases would be for iterators or complex template types.
Some examples:

```cpp
auto p = std::make_unique<int>(0);        // good: easy to infer that p is a std::unique_ptr<int>
auto i = my_map.begin();                  // good, easy to see it is an iterator and avoids writing std::unordered_map<std::string, int>::iterator
auto a = my_func();                       // bad: what type does my_func return?
auto b = static_cast<unsigned>(value);    // good: easy to infer since it is cast to the expected type in the same line
```
