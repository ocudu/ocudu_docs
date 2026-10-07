# Style Aspects: High Level Issues

## Self-contained Headers

Header files should be self-contained, this means that they can compile on their own.

In general, a header may be implemented by one or more source files. Each of these source files will include the header file that defines
the interface first in the include list (see include style).

## Using `#include` Sparingly

Headers included in other header files propagate transitively. For instance, if header file `foo.h` includes header file `bar.h`,
any file that includes `foo.h` will also include `bar.h` implicitly. To avoid long compilation times, includes of large header files
should be taken with care.

When you are about to include a large header file `large_include.h` in another header file `my_module.h`, consider the following improvements:

1. Can `large_include.h` be included by the respective source file `my_module.cpp` instead? This will avoid the transitive propagation of `large_include.h` by any file that includes `my_module.h`.
2. Can `my_module.h` just include a subset of the `large_include.h` included headers? E.g. `my_module.h` may just need access to interface definitions, rather than derived class implementations.
3. If 1. is not possible without altering code, consider making forward declarations of `large_include.h` types and use reference/pointers in `my_module.h`. Then, place the `large_include.h` header in `my_module.cpp` instead.

## Using “Internal” Headers

When writing a module, avoid adding implementation details, helper classes and utility functions in the public interface header that are only
meant to be used by the module internally.
Instead, create a private header file in the same directory as the source files and include it locally. This will avoid polluting the public
interface with unnecessary dependencies reducing recompilations.

## Use of `namespace`

Avoid opening namespace blocks inside a .cpp file that spans for the complete file.

When adding a free function implementation in a .cpp file, avoid opening namespace blocks. Instead, use the namespace qualifier to ensure that the
function definition matches the new declaration.

Close every namespace block, including nested and one-line ones, with a comment naming it (`} // namespace ocudu`).
Anonymous namespaces close with `} // namespace`

```cpp
// foo.h
namespace ocudu {
int foo(const char *s);
} // namespace ocudu

// foo.cpp
#include "foo.h"
using namespace ocudu;
int ocudu::foo(const char *s) {
  // ...
}
```

**Avoid** this:

```cpp
// foo.cpp

#include "foo.h"
namespace ocudu { // Namespace block.
int foo(char *s) { // Mismatch between "const char *" and "char *"
    // ...
}
} // end namespace ocudu
```

The above code snippet will add a new overload of ocudu::foo instead of providing a definition of the existing function declared in the header.
To make things a bit worse, this error will be detected by the linker towards the end of the build, instead of being detected instantly by the compiler.

A final word about namespace qualification: when you need to call a C library or system function like `read()`, `socket()`, etc,
you should prefix the calls with `::` such as `::socket()`, this will avoid potential name clashes and unexpected behavior.

## Using “early exits” and `continue`

When reading code, keep in mind how much state information and how many previous decisions have to be remembered by the reader to understand a block of code.
Aim to reduce indentation where possible, unless doing so would make the code more readable.
One great way to do this is by making use of early exits and the `continue` keyword in long loops.

This example does not use early exits:

```cpp
int *my_function(my_class *p) {
  if (!p->f1() && p->f2() &&
      my_other_function(p)) {
    // ... some long code ....
  }

  return nullptr;
}
```

This can be transformed to:

```cpp
int *my_function(my_class *p) {
  // f1 for this p is true because ...
  if (p->f1()) {
    return nullptr;
  }

  // f2 for this p is false because ...
  if (!p->f2()) {
    return nullptr;
  }

  // Something else ...
  if (!my_other_function(p)) {
    return nullptr;
  }

  // ... some long code ....
}
```

Similarly, in loops:

```cpp
for (int i : my_vector) {
  if (i % 7 == 0) {
    if (check_something(i)) {
      do_something(i);
    } else {
        // ... some long code ....
    }
  }
}
```

Can be transformed to:

```cpp
for (int i : my_vector) {
  if (i % 7 != 0) {
    continue;
  }
  if (check_something(i)) {
    do_something(i);
    continue;
  }
  // ... some long code ....
}
```

## Avoid `else` after a `return` statement

Following the same reasoning as the previous point, avoid using `else` or else if after a statement that interrupts control flow like return, break, continue, goto, etc.

For example:

```cpp
case 2: {
  if (something) {
    v = get_buffer_type_1();
    if (!v.is_valid()) {
      error_string = "Invalid buffer type 1";
      return -1;
    } else {
      break;
    }
  } else {
    v = get_buffer_type_2();
    if (!v.is_valid()) {
      error_string = "Invalid buffer type 2";
      return -1;
    } else {
      break;
    }
  }
}
```

Can be transformed to:

```cpp
case 2: {
  if (something) {
    v = get_buffer_type_1();
    if (!v.is_valid()) {
      error_string = "Invalid buffer type 1";
      return -1;
    }
  } else {
    v = get_buffer_type_2();
    if (!v.is_valid()) {
      error_string = "Invalid buffer type 2";
      return -1;
    }
  }
  break;
}
```

Or optimally to:

```cpp
case 2: {
  if (something) {
    v = get_buffer_type_1();
  } else {
    v = get_buffer_type_2();
  }

  if (!v.is_valid()) {
      error_string = (something) ? "Invalid buffer type 1"
                                 : "Invalid buffer type 2";
      return -1;
  }
  break;
}
```

This way helps to understand the code better as you need to keep track of less context and reduces indentation.

## Use of Static Helper Functions

It is very common to write small loops that just compute a boolean value, for example:

```cpp
bool found_valid = false;
for (unsigned i = 0, e = vector.size(); i != e; **i)
  if (vector[i]->is_valid()) {
    found_valid = true;
    break;
  }

if (found_valid) {
  ...
}
```

Instead of writing this loop inside a bigger function, extract it to a predicate function (usually static) that also uses early exits:

```cpp
/// Returns true if the input vector contains a valid buffer.
static bool has_valid_buffer(const std::vector<buffer *> &vector) {
  for (unsigned i = 0, e = vector.size(); i != e; **i) {
    if (vector[i]->is_valid()) {
      return true;
    }
  }
  return false;
}
...
if (has_valid_buffer(vector)) {
  ...
}
```

Writing it this way has many benefits:

1. Reduces indentation.
2. Factors code that can be potentially reused by other places.
3. Forces the programmer to give a name for the function, converting a piece of code into a concept which is easier to understand by the reader (a raw loop vs a function call with name `has_valid_buffer()`).
4. Includes a documentation block for the function.

Please extrapolate this example to more complex cases where the predicate is not as obvious. Instead of being faced with all the inline details of how the predicate is checked,
we can trust the function and continue reading with better locality.

## Use of designated initializers

When creating an instance of an aggregate type, use
[designated initializers](https://en.cppreference.com/w/cpp/language/aggregate_initialization#Designated_initializers)
(C++20) and **set every member**, instead of default-constructing the object and assigning its members afterward.

**When it applies**

The rule depends only on the type, never on where the type comes from. It applies whenever the type is an
**aggregate**: it has no user-declared constructors, no private or protected non-static data members, no virtual
functions, and no virtual, private or protected base classes. Default member initializers do not change this. In
particular:

- **Generated types are covered**: ASN.1 sequences (`asn1::*::*_s`), FAPI/F1AP/NGAP message structs and any other
  generated struct that is an aggregate.
- **It applies wherever an object is created**: local variables, `return` statements, function arguments,
  `emplace`/`push_back` arguments and nested members.
- **List every member**, even those whose default value is the one you want. A member you leave out silently takes its
  default member initializer (or is value-initialized), and the reader cannot tell whether that was intended or forgotten.
- **Computed values are not an excuse**: values that need conditions or arithmetic (`if`, `switch`, optional handling,
  etc.) go into helper variables or helper functions first, and then into the initializer. Containers filled by a loop
  follow the same approach: build the container first, then pass it to the initializer.

**Exceptions**

- Types that are not aggregates, i.e., classes with constructors.
- Members that can only be set through a method, such as ASN.1 choice types (`*_c`) and enumerated wrappers (`*_e`),
  which are set with `set_*()` or by assigning the enumerator.

**Rationale**

- **Readability**: every value is labeled with the member it initializes, so the construction is self-documenting.
- **Safety**: the object is fully initialized at the point of declaration. There is no window in which it holds
  indeterminate values (e.g., an uninitialized `int`).
- **Immutability**: because the object is complete on creation, it can be declared `const`.
- **Maintainability**: with `-Wmissing-field-initializers` (enabled by `-Wextra`), recent compilers warn when a member
  is omitted, so new members are not silently forgotten.

**Notes**

- Designators must appear in the same order as the members are declared.
- Use braces `{}`, not parentheses `()`. Designated initializers only work with brace initialization.

**Example: basic usage**

```cpp
struct foo
{
  unsigned                unsigned_value;
  int                     integer_value;
  bool                    flag;
  std::optional<unsigned> optional_value;
};

// Bad: default-construct and then assign. The members are indeterminate until assigned, and optional_value is
// forgotten.
foo f;
f.unsigned_value = 1;
f.integer_value  = 2;
f.flag           = false;

// Bad: optional_value is omitted. Was that intended?
const foo f{.unsigned_value = 1, .integer_value = 2, .flag = false};

// Good: every member is initialized at the point of declaration.
const foo f{.unsigned_value = 1, .integer_value = 2, .flag = false, .optional_value = std::nullopt};
```

**Example: computed values**

```cpp
// Bad: falling back to member assignment because some values need computing.
foo f;
f.unsigned_value = 1;
f.integer_value  = 2;
f.flag           = is_feature_enabled(cfg);
if (f.flag) {
  f.optional_value = cfg.threshold;
}

// Good: compute the values first, then build the instance. This shall be mainly done if the initializer gets too complicated.
const bool                    flag           = is_feature_enabled(cfg);
const std::optional<unsigned> optional_value = flag ? std::optional<unsigned>{cfg.threshold} : std::nullopt;

const foo f{.unsigned_value = 1, .integer_value = 2, .flag = flag, .optional_value = optional_value};
```

**Example: containers and nested aggregates**

```cpp
struct cell_config
{
  pci_t                 pci;
  std::vector<unsigned> active_prbs;
};

struct du_config
{
  std::string              name;
  std::vector<cell_config> cells;
};

/// Builds the list of active PRBs for a cell.
static std::vector<unsigned> build_active_prbs(unsigned nof_prbs)
{
  std::vector<unsigned> prbs;
  for (unsigned i = 0; i != nof_prbs; ++i) {
    prbs.push_back(i);
  }
  return prbs;
}

// Good: the container is built by a helper function, and the nested aggregates also use designated initializers.
const du_config cfg{.name  = "du_1",
                    .cells = {cell_config{.pci = 1, .active_prbs = build_active_prbs(nof_prbs)}}};
```

## Group constructor parameters into configuration and dependencies

Constructors that take many parameters are hard to read, easy to call with arguments in the wrong order (especially
when several parameters share a type), and painful to extend.

When a constructor needs more than three parameters, group them into two aggregate structs:

- **Configuration**: values that describe *how* the object behaves (numbers, flags, names, etc.).
- **Dependencies**: other objects that the class *uses* or *owns* (loggers, executors, notifiers, other components).

The same rules apply to:

- **Factory functions** (e.g., `create_foo(...)`): they take the same configuration and dependencies structs as the
  constructor of the object they build.
- **Existing structs**: a struct must not mix configuration and dependencies. If it does, split it into two.

**Rationale**

- Call sites become self-documenting, since the structs are built with
  [designated initializers](#use-of-designated-initializers).
- Adding a new parameter does not change the constructor signature.
- The configuration can be stored, logged, compared or passed around as a single unit, separately from the objects the
  class depends on.

**Example**

Instead of this:

```cpp
class foo
{
public:
  foo(int integer_value_, unsigned unsigned_value_, bool flag_, bar& bar_instance_, baz& baz_instance_) :
    integer_value(integer_value_),
    unsigned_value(unsigned_value_),
    flag(flag_),
    bar_instance(bar_instance_),
    baz_instance(baz_instance_)
  {}

private:
  int integer_value;
  unsigned unsigned_value;
  bool flag;
  bar& bar_instance;
  baz& baz_instance;
};
```

Write this:

```cpp
/// Holds the foo configuration parameters.
struct foo_configuration
{
  int      integer_value;
  unsigned unsigned_value;
  bool     flag;
};

/// Holds the foo dependencies.
struct foo_dependencies
{
  bar& bar_instance;
  baz& baz_instance;
};

class foo
{
public:
  foo(const foo_configuration& cfg, const foo_dependencies& dependencies) :
    integer_value(cfg.integer_value),
    unsigned_value(cfg.unsigned_value),
    flag(cfg.flag),
    bar_instance(dependencies.bar_instance),
    baz_instance(dependencies.baz_instance)
  {
  }

private:
  int      integer_value;
  unsigned unsigned_value;
  bool     flag;
  bar&     bar_instance;
  baz&     baz_instance;
};
```

When creating an instance, designated initializers are **mandatory**:

```cpp
foo f(foo_configuration{.integer_value = 1, .unsigned_value = 2, .flag = true},
      foo_dependencies{.bar_instance = bar_instance, .baz_instance = baz_instance});
```

**Tips**

- If the class only reads its configuration, store it as a single member (`const foo_configuration cfg;`) instead of
  copying each field:

```cpp
class foo
{
public:
  foo(const foo_configuration& cfg_, const foo_dependencies& dependencies) :
    cfg(cfg_), bar_instance(dependencies.bar_instance), baz_instance(dependencies.baz_instance)
  {
  }

private:
  const foo_configuration cfg;
  bar&                    bar_instance;
  baz&                    baz_instance;
};
```

- In the dependencies struct, prefer references over raw pointers. Use a pointer only when the dependency is optional,
  and document that it may be `nullptr`.

```cpp
struct foo_dependencies
{
  bar& bar_instance;
  /// Optional. May be nullptr when metrics are disabled.
  metrics_notifier* metrics = nullptr;
};
```

**Owned dependencies**

If the class takes ownership of a dependency (e.g., a `std::unique_ptr`), the dependencies parameter **cannot be
`const`**, because you cannot move from a `const` object. Take the dependencies struct by value and move the owned
members out of it:

```cpp
struct foo_dependencies
{
  bar&                 bar_instance;
  std::unique_ptr<baz> baz_instance; // Owned by foo: must be moved.
};

class foo
{
public:
  foo(const foo_configuration& cfg, foo_dependencies deps) :
    integer_value(cfg.integer_value),
    unsigned_value(cfg.unsigned_value),
    flag(cfg.flag),
    bar_instance(deps.bar_instance),
    baz_instance(std::move(deps.baz_instance))
  {
  }

private:
  int                  integer_value;
  unsigned             unsigned_value;
  bool                 flag;
  bar&                 bar_instance;
  std::unique_ptr<baz> baz_instance;
};

foo f(foo_configuration{.integer_value = 1, .unsigned_value = 2, .flag = true},
      foo_dependencies{.bar_instance = my_bar, .baz_instance = std::make_unique<baz>()});
```

**Factory functions**

```cpp
// Bad: the factory has a long list of positional parameters.
std::unique_ptr<foo> create_foo(int integer_value, unsigned unsigned_value, bool flag, bar& bar_instance);

// Good: the factory takes the same structs as the constructor.
std::unique_ptr<foo> create_foo(const foo_configuration& cfg, foo_dependencies deps);
```

## Return objects by value instead of using output parameters

When a function creates a new object, return it by value rather than filling a parameter passed by reference. Since C++17, returning a temporary (`return foo{...};`) is guaranteed to elide the copy, and returning a named local variable (`foo result; ...; return result;`) is usually optimized the same way (NRVO). In both cases, returning by value costs nothing extra.

**Rationale**

- The function signature clearly shows what is an input and what is the output.
- The caller can declare the result `const` and never deals with a half-built object.
- Failure is expressed in the return type instead of a separate status flag that can be ignored.

**Example**

```cpp
struct foo
{
  int value;
};

// Bad: the caller must create the object beforehand and pass it in to be filled.
void make_foo(foo& f, int value)
{
  f.value = value;
}

// Good: return the newly created object.
foo make_foo(int value)
{
  return foo{.value = value};
}

// Bad: report failure through a bool and return the object through a reference parameter.
// The caller can ignore the bool and use an object that was never filled.
bool make_foo(foo& f, int value, bool error)
{
  if (error) {
    return false;
  }

  f.value = value;
  return true;
}

// Good: return std::optional when creation can fail.
std::optional<foo> make_foo(int value, bool error)
{
  if (error) {
    return std::nullopt;
  }

  return foo{.value = value};
}
```

**Tip:** if the caller needs to know *why* the operation failed, return `std::expected<foo, error_type>` (from `ocudu/adt/expected.h`) instead of `std::optional<foo>`.
