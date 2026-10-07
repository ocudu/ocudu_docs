# Recommendations

## Function and Class Length

**Avoid** writing classes or functions that are too large.

As a rule of thumb, functions should fit in a window and no scrolling should be needed to review them.
Try to write functions that only do one thing or action. If you write a function that does more than one thing, try to split it into multiple functions,
each of which do a single thing. This will dramatically improve code maintainability. By using concise function names,
and by having each function well documented, code will be much easier to understand.

For classes, it is harder to set a maximum number of lines, so instead, give a class a single responsibility. Although the concept of responsibility
may sound abstract, another way of thinking about it is that a class should only have “one reason to change”.
If a class does multiple things or responsibilities, it is better to split it into multiple classes.
This way we may avoid falling into the *god class* anti-pattern which can be a maintenance nightmare.

## Scope

Define variables where they are going to be used, making their scope as short as possible. This applies to both C++ and C code.

For example:

```cpp
int i;
float f;
...
... other unrelated code ...
...
f = get_float();
a = f * get_multiplier();
```

Should be transformed to:

```cpp
...
... other unrelated code ...
...
float f = get_float();
int i = f * get_multiplier();
```

The same applies to type aliases (`using`): **do not** declare them at namespace or file scope. Declare them in the
narrowest scope where they are used (function, class or block). If the alias is repeated in the same cpp file, it is
allowed to define in at file scope to avoid that repetition, but **never** in a header file.

```cpp
// Bad: the alias is visible in the whole file (and in every file including it, if this is a header).
using ue_map = std::unordered_map<du_ue_index_t, ue_context>;

void ue_manager::add_ue(du_ue_index_t ue_index)
{
  ue_map& ues = get_ues();
  // ...
}

// Good: the alias only exists where it is needed.
void ue_manager::add_ue(du_ue_index_t ue_index)
{
  using ue_map = std::unordered_map<du_ue_index_t, ue_context>;
  ue_map& ues  = get_ues();
  // ...
}
```

## Logical Operators

The codebase uses the standard form of logical operators:

* `&&`, `||` and `!`

As opposed to the alternative form:

* `and`, `or` and `not`

The following code block shows the correct and incorrect use of logical operators:

```cpp
if (!a && (b == 8))     // Correct, only used the standard form.

if (not a && (b == 8))  // Incorrect, used 'not' instead of the standard form '!'.
```

**Exception**: when editing an existing file in which most logical operators already use the alternative form, follow
the style of the file for consistency. Do not mix both forms in the same file.

## Using References(&) Over Pointers(\*)

In the general, it is better to use references instead of pointers.
C++ references have a simpler syntax than pointers and always refer to a valid object (unless you do some undefined behavior).

Pointers are very useful when the pointed object may optionally be *nullptr*, however managing this case may require adding additional checks
to manage this situation.

```cpp
static bool check_objects_are_equal(foo *left, foo *right);              // Bad, left or right may be nullptr, prefer references.
static bool check_objects_are_equal(foo left, foo right);                // Bad, copies objects.
static bool check_objects_are_equal(foo &left, foo &right);              // Bad, missing const, checking the objects should not modify them.
static bool check_objects_are_equal(const foo &left, const foo &right);  // Good.
static void fill_optional_object(foo *x);                                // Good, x is optional, function checks for nullptr.
```

## Const Correctness

Write code that is `const` correct.

```cpp
const object& get_object() const; // Return value cannot be modified, method does not modify the contents of the class.
```

Const correctness applies to the interfaces: method qualifiers, reference and pointer parameters, and return types.
For local variables of value type, **do not** add `const` by default, as it adds noise without giving extra guarantees
to callers. Const references to existing objects are still encouraged (see [Avoid Complex Expressions](#avoid-complex-expressions)).

```cpp
// Preferred: plain local variables.
unsigned nof_prbs = cfg.nof_prbs;
float    gain_dB  = compute_gain(nof_prbs);

// Fine: a const reference prevents modifying the original object by mistake.
const cell_configuration& cell_cfg = cells[cell_index];
```

**Exceptions**

- When editing an existing file in which most local variables are already declared `const`, follow the
  style of the file for consistency.
- Parameters of type `ocudulog::basic_logger` in functions, methods or constructors are always passed as a non-`const`
  reference (`ocudulog::basic_logger&`), never as a `const` reference or by value.

## Avoid Complex Expressions

Try to use local variables to store intermediate results or to cache the result of a function call when calling it multiple times
and it is known not to change. This will help to avoid complex expressions.

For example:

```cpp
for (unsigned i = 0; i != get_bar_count(); ++i) {
  if (get_bar_count() < i) {
    do_something();
  }
  do_other();
}
```

Can be transformed to this code, saving many calls to `get_bar_count()`

```cpp
unsigned bar_count = get_bar_count();
for (unsigned i = 0; i != bar_count; ++i) {
  if (bar_count < i) {
    do_something();
  }
  do_other();
}
```

There may be cases where you *need* to work with complex and deep nested structures. In these cases try to store intermediate members
as pointers or references (if writing C++ code) and remember to use `const` if only reading the values.
This will avoid needless typing, having more compact code and potentially improving performance for unneeded indirection chasing pointers.

For example:

```cpp
for (uint32_t j = 0, je = metrics_tmp.size(); j != je; ++j) {
  metrics[j].dl.n_samples += metrics_tmp[j].dl.n_samples;
  metrics[j].dl.mcs += metrics_tmp[j].dl.n_samples * metrics_tmp[j].dl.mcs;
  metrics[j].ul.n_samples += metrics_tmp[j].ul.n_samples;
}
```

Can be transformed into:

```cpp
for (uint32_t j = 0, je = metrics_tmp.size(); j != je; ++j) {
  downlink_metrics &dl = metrics[j].dl;  // store non const reference to access the struct
  const downlink_metrics &dl_tmp = metrics_tmp[j].dl;  // const ref to access the struct

  dl.n_samples += dl_tmp.n_samples;
  dl.mcs += dl_tmp.n_samples * dl_tmp.mcs;

  uplink_metrics &ul = metrics[j].ul;
  const uplink_metrics &ul_tmp = metrics_tmp[j].ul;
  ul.n_samples += ul_tmp.n_samples;
}
```

## Magic numbers

Avoid the use of magic numbers. Instead, use a variable (`static`, `constexpr`, etc.): this way, you will be forced to give it
a descriptive name, improving code readability.

```cpp
if (b < 2.0)  // Bad
  ...

static constexpr float detection_threshold_dB = 2.0;
if (b < detection_threshold_dB)  // Good - we now know this is a detection threshold value in dBs
  ...
```

## Fixed Width Integer Types

Use the fixed width integer types (`uint32_t`, etc…) found in the `cstdint` and `stdint.h` header files when you need to
ensure that a variable needs to be of fixed size, independent of the target architecture.

Usually you will need to use these types when defining message structures, interfacing hardware, network programming, etc…
However, **avoid** using them when the type width is not important because the use of a fixed size type is a declaration done by the programmer
that the affected code needs special treatment and careful handling.

Notice that all 32-bit architectures and above define `int` and `unsigned int` to be of 32-bits, so it is safe to use the generic
types safely unless you know you will need a wider type.

**Rationale**

- **Readability**: fixed-width types act as a warning sign for the reader. They lose this meaning if they are used everywhere.
- **No performance gain**: `unsigned` and `int` already have the size the CPU handles most efficiently. Smaller types are promoted to `int` in every arithmetic expression, and the compiler may need extra instructions to truncate the result back.
- **Fewer bugs**: small types overflow silently, and `uint8_t`/`int8_t` are character types in practice, so they print as characters instead of numbers.

```cpp
for (uint32_t cc_idx = 0; cc_idx != num_cc; ++cc_idx)
    // here we know we're never going to exceed 4 billion cc's - safe to use a generic unsigned int (32 bits)

for (uint32_t i = 0, e = vector.size(); i != e; ++i)
    // how many elements will the vector hold?
    // a) if we know it is going to hold less than 4 billion, use unsigned int (32 bits)
    // b) if in doubt, use size_t.
    // but as you can see there is no need to use a fixed width type, generic types can be safely used here.

// Bad: the width of these variables does not matter.
uint32_t nof_ues = 0;
for (uint32_t i = 0, e = ue_list.size(); i != e; ++i) {
  // ...
}
uint8_t compute_nof_retxs(const harq_process& h);

// Good: generic types for counters, indices and general values.
unsigned nof_ues = 0;
for (unsigned i = 0, e = ue_list.size(); i != e; ++i) {
  // ...
}
unsigned compute_nof_retxs(const harq_process& h);

// Good: the layout of this header is defined by the protocol and must not depend on the CPU.
struct gtpu_header
{
  uint8_t  flags;
  uint8_t  message_type;
  uint16_t length;
  uint32_t teid;
};
static_assert(sizeof(gtpu_header) == 8, "GTP-U header must be 8 bytes");

// Good: the wrap-around at 2^12 is part of the protocol logic.
static constexpr uint16_t pdcp_sn_mask = 0x0fff;
uint16_t next_sn = (sn + 1) & pdcp_sn_mask;
```

Avoid using the `long` type since it can be either 32 or 64-bits depending on the architecture. See the [standard definition](https://en.cppreference.com/w/cpp/language/types) for more information.

## Function signatures

When declaring a function, the list of arguments shall be ordered as follows:

1. Arguments passed by reference or pointer, if any, that are only used to store the function output. These arguments are documented by the Doxygen command `\param[out]`.
2. Arguments passed by reference or pointer, if any, that contain inputs to the function and will also be modified by the function itself. These arguments are documented by the Doxygen command `\param[in,out]`.
3. Arguments passed by value, constant pointer or constant reference, if any, that represent inputs to the function. These arguments are documented by the Doxygen command `\param[in]`. In particular, structures gathering a number of configuration parameters, shall appear last in the argument list.

For example:

```cpp
/// \brief Does something.
///
/// This function writes a span, reads and modifies a vector, only reads the rest of arguments.
/// \param[out]    fnct_out       Main function output (recall that \c span behaves like a pointer).
/// \param[in,out] my_vector      A vector of integers the function may read and modify.
/// \param[in]     another_vector A vector of integers the function may only read.
/// \param[in]     quantity       Another value the function needs to know about.
/// \param[in]     cfg_struct     A structure describing the context the function works in.
void my_function(span<int> fnct_out, std::vector<int>& my_vector, const std::vector<int>& another_vector, int quantity, const config_t& cfg_struct);
```

**Exceptions**
- If there is a parameter with a default value, keep it with the default value and in the last position of the function
  signature.

## Class Layout Example

This section describes the recommended layout of a class declaration, recommendations found inline.

```cpp
/// Class description block.
class my_class : public interface_1 {
    // Define private constant configurable parameters first - easy to find by class maintainers to be always in the
    // same place.
    /// Constant 1 explanation.
    static constexpr unsigned some_constant_1 = 2;
    /// Constant 2 explanation.
    static constexpr unsigned some_constant_2 = 7;

public:
    // Declare/define special members first (constructors, destructor, etc...)
    // No need to document special members unless something not trivial requires an explanation.
    my_class() { ... }  // If the ctor body is big, move it down to the cpp file.
    ~my_class() { ... }  // Likewise, if the dtor body is big, move it down to the cpp file.

    /// Method 1 explanation block.
    void method1();
    // Separate method declarations with a single newline.
    /// Method 2 explanation block.
    void method2();

    // Try to group methods of the same category, accessors, modifiers, utilities...

    /// Getter explanation block.
    something& get_something();
    const something& get_something() const; // Feel free to provide two identical explanation blocks or declare
                                            // both methods in a row, no need of newline here.

    /// Getter explanation block.
    another_thing& get_anotherthing();  // Here we separated the const and non const method declarations.
                                        // Please be consistent per class basis.

    /// Getter explanation block.
    const another_thing& get_anotherthing() const;

    // No need to add documentation for overridden interface methods, as they are already documented in the interface,
    // we don't want to keep two copies of documentation blocks since they can easily diverge creating maintenance issues.
    void interface_method1() override;
    // Remember to add a newline between methods.
    void interface_method2() override;

    /// Enum description block.
    // Define the enum near the site where it is going to be used to improve locality when reading the interface.
    enum class my_enum {
        enumerator1,
        enumerator2
    };

    /// Method using above enum description block.
    void method_uses_enum(my_enum e); // my_enum is declared above - easy to find.

protected:  // After the public method section is done, declare the rest if applicable (protected, private).
    // The audience here has changed to class developers, not public interface users anymore, we avoid polluting the public
    // interface with implementation details
    /// Protected method explanation block.
    void prot_method();

private:  // Private method section.
    // This will be only read by users who need to understand implementation details. Keep away of public interface.
    /// Private method explanation block.
    void private_method();

protected: // Declare member variables at the end. Keep them separated from methods.
    /// Protected member variable.
    unsigned protected_member_var;

private: // Last, declare private member variables.
    // Variable names should be descriptive, so most of the times there is no need to document them.
    unsigned memb_var_1;
    void* memb_var_2;
    /// Protects access to memb_var_2.
    // In the case of a mutex it helps to add a short explanation of what is protecting...
    mutable std::mutex m;
};
```

**Layout rules summary**

1. Separate method declarations with an empty line to improve readability.
2. Do not separate member variable declarations with empty lines.
3. Never declare methods after member variables.
4. Inside method and function definitions, use empty lines to split the implementation into logical blocks.

```cpp
void scheduler::run_slot(slot_point sl)
{
  // Clean up the state of the previous slot.
  release_expired_harqs(sl);
  ue_db.slot_indication(sl);

  // Allocate the common channels first.
  ssb_sched.run_slot(sl);
  sib1_sched.run_slot(sl);

  // Allocate the UEs with the remaining resources.
  ue_sched.run_slot(sl);
}
```

## Inject loggers instead of fetching them

**Do not** fetch loggers inside class implementations or free functions. Instead, fetch the logger once in the factory
or builder that creates the object, and pass it as a reference (usually as part of the
[dependencies struct](3_style_aspects_high_level.md#group-constructor-parameters-into-configuration-and-dependencies)).

**Rationale**

- The dependency on the logger is visible in the constructor, like any other dependency.
- Tests can inject a different logger, or a logger with a different level, without touching the implementation.
- The logger name is chosen in a single place.

```cpp
// Bad: the logger is fetched inside the implementation.
rlc_tx_entity::rlc_tx_entity(const rlc_tx_config& cfg_) :
  cfg(cfg_), logger(ocudulog::fetch_basic_logger("RLC"))
{
}

// Good: the logger is injected.
rlc_tx_entity::rlc_tx_entity(const rlc_tx_config& cfg_, ocudulog::basic_logger& logger_) :
  cfg(cfg_), logger(logger_)
{
}

// The factory is the only place where the logger is fetched.
std::unique_ptr<rlc_tx_entity> create_rlc_tx_entity(const rlc_tx_config& cfg)
{
  return std::make_unique<rlc_tx_entity>(cfg, ocudulog::fetch_basic_logger("RLC"));
}
```

## Prefer `std::unordered_map` over `std::map`

Use `std::unordered_map` instead of `std::map` unless you need the elements to be sorted by key (e.g., to iterate them
in order, or to use `lower_bound()`). `std::map` keeps its elements sorted at all times, which makes insertions and
lookups more expensive (O(log n) vs. average O(1)).

```cpp
// Bad: the UEs are never iterated in order, so the sorting is a wasted cost.
std::map<du_ue_index_t, ue_context> ues;

// Good.
std::unordered_map<du_ue_index_t, ue_context> ues;

// Good: the timers must be processed in order of expiration.
std::map<slot_point, timer_callback> pending_timers;
```

If the key is a small dense index (e.g., `du_ue_index_t`), consider a fixed-size container such as `slotted_array`,
which avoids hashing altogether.

## Pass temporaries instead of using `std::move`

When an object is created only to be passed to a function, create it directly in the call instead of declaring a named
local variable and moving it.

**Rationale**

- There is no moved-from variable left in scope that could be used by mistake.
- The code is shorter, and the compiler can construct the object directly in place.

```cpp
// Bad: msg is only created to be moved, and it remains in scope in an unspecified state.
f1ap_message msg{.pdu = build_ue_context_setup(ue_index)};
notifier.on_new_message(std::move(msg));

// Good.
notifier.on_new_message(f1ap_message{.pdu = build_ue_context_setup(ue_index)});
```

Using `std::move` is still the right choice when the object is built step by step, or when it already exists (e.g., a
member or a parameter taken by value).

## Receive only what you need

A function should receive only the data it uses. If it only uses one member of a struct (e.g., a nested
configuration), pass that member instead of the whole struct.

**Rationale**

- The signature documents exactly what the function depends on.
- The function can be reused and tested without building the whole parent struct.
- Changes to unrelated members of the parent struct do not affect the function.

```cpp
struct cell_config
{
  pci_t           pci;
  pdcch_config    pdcch_cfg;
  pucch_config    pucch_cfg;
  // ... many more members ...
};

// Bad: only cfg.pucch_cfg is used, but the whole cell configuration is required.
unsigned compute_nof_pucch_resources(const cell_config& cfg);

// Good: the function receives only what it uses.
unsigned compute_nof_pucch_resources(const pucch_config& pucch_cfg);
```

## Cache repeated accessors in references

If the same accessor or member chain (e.g., `cells[cell_index]` or `cfg.phy.ports.nof_ports`) is used several times in
a function, store it once in a reference (`const` if only reading). This avoids repeated lookups and indirections, and
makes the code shorter and easier to read. See also [Avoid Complex Expressions](#avoid-complex-expressions).

```cpp
// Bad: cells[cell_index] is evaluated four times.
++cells[cell_index].nof_ues;
cells[cell_index].active = true;
if (cells[cell_index].nof_ues > max_ues) {
  logger.warning("Cell {} exceeds the maximum number of UEs", cells[cell_index].pci);
}

// Good.
cell_context& cell = cells[cell_index];
++cell.nof_ues;
cell.active = true;
if (cell.nof_ues > max_ues) {
  logger.warning("Cell {} exceeds the maximum number of UEs", cell.pci);
}
```

## Default member initializers in classes with constructors

If a class has user-defined constructors and **all of them** initialize every member in their member initializer list,
do not add default member initializers to those members. The default values would never be used, and the reader would
have to check two places to know the initial value of a member.

For structs and classes without such constructors, see
[Default member initializers](8_cpp_good_practices.md#default-member-initializers).

```cpp
// Bad: the default values are always overwritten by the constructor.
class harq_entity
{
public:
  harq_entity(unsigned nof_processes_, unsigned max_retxs_) : nof_processes(nof_processes_), max_retxs(max_retxs_) {}

private:
  unsigned nof_processes = 8;
  unsigned max_retxs     = 4;
};

// Good: the constructor is the single place where the members are initialized.
class harq_entity
{
public:
  harq_entity(unsigned nof_processes_, unsigned max_retxs_) : nof_processes(nof_processes_), max_retxs(max_retxs_) {}

private:
  unsigned nof_processes;
  unsigned max_retxs;
};
```

## Avoid double lookups

When accessing a container, do not look up the same key more than once in the same function. Look it up once, keep
the resulting iterator or reference, and reuse it.

```cpp
// Bad: two lookups, one for count() and another one for at().
if (ues.count(ue_index) != 0) {
  ues.at(ue_index).handle_rx(pdu);
}

// Good: a single lookup.
if (auto it = ues.find(ue_index); it != ues.end()) {
  it->second.handle_rx(pdu);
}

// Bad: two lookups, one for find() and another one for operator[].
if (ues.find(ue_index) == ues.end()) {
  ues[ue_index] = ue_context{ue_index};
}

// Good: a single lookup that inserts only if the key is not present.
ues.try_emplace(ue_index, ue_index);
```

## Store a reference to shared objects, copy only what the class owns

A class member that is initialized from a constructor parameter passed by reference, pointer or `span` must keep that
form unless the class needs its own copy.

- **Store a reference** (`const T&`, `T&`, `span<const T>`) when the object is owned by a component that outlives the
  class, e.g., the configuration owned by the parent that builds the class, or an object shared by sibling components.
- **Store a copy** only when the class must own the object: nothing guarantees it outlives the class, or the class
  modifies its own version. In that case take the parameter **by value** and `std::move` it into the member (see
  [Move semantics](8_cpp_good_practices.md#move-semantics)), so the copy is visible in the signature.
- Components that receive the same object from the same owner hold it in the **same form**.

**How to check it**: for every data member, find the constructor parameter that initializes it. A member of value
type `T` (or `const T`) initialized from a `const T&` parameter is a hidden copy and a violation, unless a comment on
the member says why the class needs its own copy.

  ```cpp
  // Bad: test_cfg_ is received by reference but silently copied into the member.
  class du_pdsch_resource_manager
  {
  public:
    du_pdsch_resource_manager(span<const du_cell_config> cell_cfg_list_, const du_test_mode_config& test_cfg_);

  private:
    span<const du_cell_config> cell_cfg_list;
    const du_test_mode_config  test_cfg;
  };

  // Good: the configuration is owned by du_ran_resource_manager_impl, which outlives this class.
  private:
    span<const du_cell_config> cell_cfg_list;
    const du_test_mode_config& test_cfg;

  // Good: the class owns its configuration. The copy is explicit in the signature.
  explicit rrc_ue(rrc_ue_config cfg_) : cfg(std::move(cfg_)) {}
  ```
