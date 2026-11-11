# C++ Good Practices

This page collects additional C++ good practices that complement the rest of this guide. Each section explains the rule, the rationale behind it, and shows
examples of what to avoid and what to write instead.

---

## Ownership and RAII

Every resource (memory, file descriptors, sockets, locks, etc.) must be owned by an object whose destructor releases it. **Do not** use raw `new` and `delete`.

- Use `std::unique_ptr` by default to express ownership, and create it with `std::make_unique`.
- Use `std::shared_ptr` only when ownership is genuinely shared, and document why.
- Raw pointers and references are **non-owning**: they observe an object, they never delete it.
- For non-owning access, prefer references over raw pointers. Use a raw pointer only when the object is optional (it
  may be `nullptr`) or needs to be re-pointed later. See
  [Using References Over Pointers](5_recommendations.md#using-references-over-pointers).

**Rationale**

- **No leaks**: the resource is released automatically on every exit path, including early returns.
- **Clear ownership**: the type of a member or parameter documents who is responsible for destroying the object.

**Example**

```cpp
// Bad: manual memory management. Any early return between new and delete leaks the object.
void process()
{
  buffer* buf = new buffer(1024);
  if (!buf->is_valid()) {
    return; // Leak!
  }
  // ...
  delete buf;
}

// Good: the buffer is released automatically when buf goes out of scope.
void process()
{
  auto buf = std::make_unique<buffer>(1024);
  if (!buf->is_valid()) {
    return;
  }
  // ...
}
```

```cpp
class scheduler
{
public:
  explicit scheduler(std::unique_ptr<policy> policy_, timer_manager& timers_) :
    sched_policy(std::move(policy_)), timers(timers_)
  {
  }

private:
  /// Owned: destroyed together with the scheduler.
  std::unique_ptr<policy> sched_policy;
  /// Not owned: must outlive the scheduler.
  timer_manager& timers;
};
```

---

## Rule of zero and rule of five

Prefer the **rule of zero**: design classes so that their members manage resources by themselves, and the compiler-generated special member functions (copy/move constructors, copy/move assignments and destructor) do the right thing.

If a class needs to declare any of the five special member functions, then it should declare **all five**, either by defining them or by
explicitly marking them as `= default` or `= delete`.

Classes that should not be copied (e.g. classes holding a mutex, a reference to a unique resource, or a handle) must explicitly delete the copy operations.

**Example**

```cpp
// Good: rule of zero. The compiler-generated special members are correct.
class ue_context
{
  std::vector<bearer>       bearers;
  std::unique_ptr<rlc_entity> rlc;
};

// Good: rule of five. The class owns a raw handle and spells out all special members.
class socket_handle
{
public:
  explicit socket_handle(int fd_) : fd(fd_) {}
  ~socket_handle() { close(); }

  socket_handle(const socket_handle&)            = delete;
  socket_handle& operator=(const socket_handle&) = delete;

  socket_handle(socket_handle&& other) noexcept : fd(std::exchange(other.fd, -1)) {}
  socket_handle& operator=(socket_handle&& other) noexcept
  {
    if (this != &other) {
      close();
      fd = std::exchange(other.fd, -1);
    }
    return *this;
  }

private:
  void close()
  {
    if (fd >= 0) {
      ::close(fd);
    }
  }

  int fd = -1;
};
```

### Virtual destructors in interfaces

A class meant to be used polymorphically must have a `virtual` destructor. Otherwise, deleting a derived object through a base pointer is undefined behavior.

```cpp
/// Interface used to notify RRC events.
class rrc_notifier
{
public:
  virtual ~rrc_notifier() = default;

  /// Notifies that a UE has been released.
  virtual void on_ue_release(du_ue_index_t ue_index) = 0;
};
```

---

## Use `[[nodiscard]]`

Since OCUDU does not use exceptions, errors are reported through return values. Mark functions with `[[nodiscard]]` when ignoring their return value is almost certainly a bug. Typical cases are:

- Functions returning a status (`bool`, error codes).
- Functions returning `std::optional` or an `expected`-like type.
- Factory functions and pure functions without side effects.

**Example**

```cpp
/// Allocates a new PDU buffer. Returns std::nullopt if the pool is exhausted.
[[nodiscard]] std::optional<byte_buffer> allocate_pdu();

/// Returns true if the configuration is valid.
[[nodiscard]] bool validate(const cell_configuration& cfg);

allocate_pdu();             // Compiler warning: the result is discarded.
validate(cfg);              // Compiler warning: the result is discarded.

if (!validate(cfg)) {       // Good.
  return;
}
```

**Exceptions**
- Do not use `[[nodiscard]]` in static free functions.

---

## Lambda captures

List lambda captures explicitly. **Avoid** default captures (`[&]` and `[=]`), especially in lambdas that are not executed immediately, e.g., tasks dispatched to an executor or timer callbacks.

**Rationale**

- A lambda that captures by reference and runs later may access objects that have already been destroyed (dangling references).
- `[=]` inside a member function captures `this` implicitly, so it does **not** copy the members as one might expect.
- Explicit captures make the lifetime requirements of the lambda visible to the reader.

**Example**

```cpp
void ue_manager::schedule_release(du_ue_index_t ue_index)
{
  unsigned cause = compute_cause(ue_index);

  // Bad: cause is a local variable captured by reference. When the task runs, cause no longer exists.
  executor.defer([&]() { release_ue(ue_index, cause); });

  // Good: values are copied and the use of this is explicit.
  executor.defer([this, ue_index, cause]() { release_ue(ue_index, cause); });
}
```

If a lambda captures `this` and is executed asynchronously, document (or guarantee by design) that the object outlives the task.

---

## Non-owning views: `span` and `std::string_view`

Use `span<T>` and `std::string_view` for function parameters that only need to read (or write) a contiguous sequence of elements, instead of
`const std::vector<T>&`, `const std::string&`, or a pointer and a size.

**Never** store a view beyond the lifetime of the data it refers to, and never return a view to a temporary or a local object.

**Example**

```cpp
// Bad: forces the caller to have a std::vector, and pointer + size pairs are error-prone.
unsigned sum(const std::vector<unsigned>& values);
unsigned sum(const unsigned* values, unsigned size);

// Good: accepts vectors, arrays, static vectors and sub-ranges.
unsigned sum(span<const unsigned> values);

// Bad: returns a view to a local string that is destroyed when the function returns.
std::string_view get_name()
{
  std::string name = build_name();
  return name; // Dangling view!
}

// Bad: stores a view to data owned by somebody else, with no lifetime guarantee.
class cell_logger
{
  std::string_view cell_name; // May dangle if the original string is destroyed.
};

// Good: the class owns a copy of the string.
class cell_logger
{
  std::string cell_name;
};
```
---

## Concurrency

### Use RAII locks

Never call `lock()` and `unlock()` manually on a mutex. Use `std::lock_guard`, `std::unique_lock` (when the lock needs to be released early or used with a
condition variable) or `std::scoped_lock` (when locking several mutexes at once, avoiding deadlocks).

```cpp
// Bad: if process() returns early, the mutex is never unlocked.
mutex.lock();
process(queue);
mutex.unlock();

// Good.
{
  std::lock_guard<std::mutex> lock(mutex);
  process(queue);
}
```

### Document what each mutex protects

```cpp
class metrics_collector
{
  /// Protects access to ue_metrics and cell_metrics.
  mutable std::mutex           mutex;
  std::vector<ue_metric>       ue_metrics;
  cell_metric                  cell_metrics;
};
```

---

## Use `enum class`

Prefer scoped enumerations (`enum class`) over unscoped ones. Specify the underlying type when the size matters (e.g. in messages or packed structures).

**Rationale**

- Enumerators do not leak into the enclosing namespace, avoiding name clashes.
- There are no implicit conversions to integers, so they cannot be mixed by mistake with other enums or numbers.

**Example**

```cpp
// Bad: red and green leak into the surrounding scope and convert silently to int.
enum color { red, green };
int x = red + 1;

// Good.
enum class rlc_mode : uint8_t { tm, um, am };

rlc_mode mode = rlc_mode::am;
int      y    = mode + 1;                      // Compilation error.
auto     z    = static_cast<uint8_t>(mode);    // Explicit conversion when really needed.
```

Plain `enum` remains acceptable for the convenience constants described in the naming conventions (e.g. `MAX_ELEMENTS`), although `static constexpr` variables are preferred.

---

## Use `explicit` constructors

Mark single-argument constructors and conversion operators as `explicit`, unless an implicit conversion is intended and documented.

```cpp
class timeout
{
public:
  explicit timeout(unsigned milliseconds_) : milliseconds(milliseconds_) {}

private:
  unsigned milliseconds;
};

void start_timer(timeout t);

start_timer(100);           // Compilation error: what does 100 mean?
start_timer(timeout{100});  // Good: the intent is clear.
```

---

## Use `override` and `final`

When overriding a virtual function, use `override` (or `final`) and **do not** repeat the `virtual` keyword. The compiler will report an error if the signature does not match a function in the base class.

```cpp
class base
{
public:
  virtual ~base()                     = default;
  virtual void handle(const pdu& p)   = 0;
};

class derived : public base
{
public:
  virtual void handle(pdu& p);          // Bad: silently declares a new function (missing const).
  void handle(const pdu& p) override;   // Good: checked by the compiler.
};
```

---

## Default member initializers

In structs, and in classes that have no user-defined constructor initializing all their members, give every non-static
data member that has no meaningful default constructor (integers, booleans, enums, raw pointers) a default member
initializer. For classes whose constructors already initialize every member, see
[Default member initializers in classes with constructors](5_recommendations.md#default-member-initializers-in-classes-with-constructors).

**Rationale**

- Objects never hold indeterminate values, regardless of which constructor is used.
- Adding a new constructor does not require remembering to initialize every member.

**Example**

```cpp
// Bad: retx_count and active are indeterminate if a constructor forgets them.
struct harq_process
{
  unsigned retx_count;
  bool     active;
  rnti_t   rnti;
};

// Good.
struct harq_process
{
  unsigned retx_count = 0;
  bool     active     = false;
  rnti_t   rnti       = rnti_t::INVALID_RNTI;
};
```

---

## Passing input parameters: by value or by `const` reference

Choose how to pass an input parameter (of a function, method, constructor, lambda, etc.) based on how expensive it is
to copy:

- **Cheap to copy: pass by value.** This covers fundamental types (`bool`, integers, floating-point), enums, raw
  pointers, strong types such as `rnti_t` or `pci_t`, `std::chrono` durations, small trivially-copyable structs and
  non-owning views (`span<T>`, `std::string_view`). As a rule of thumb, a type is small if it is trivially copyable
  and its size is not bigger than two pointers (16 bytes).
- **Expensive to copy: pass by `const` reference.** This covers types that own memory (`std::vector`, `std::string`,
  `byte_buffer`, etc.), big structs such as configurations and messages, and any type whose size is bigger than 16
  bytes.
- **Not trivially copyable: pass by `const` reference, whatever its size.** A type with a user-provided copy
  constructor or destructor can be passed by `const` reference even if it is small.
- **`std::optional<T>` follows the same rule as `T`.** An `std::optional` of a small type (e.g.,
  `std::optional<du_ue_index_t>`, `std::optional<unsigned>`) is also small and trivially copyable, so pass it by value.
  An `std::optional` of a big type (e.g., `std::optional<cell_configuration>`) is passed by `const` reference.

**Rationale**

- Passing a small type by reference does not save anything: the reference is itself the size of a pointer, and every
  access goes through an extra indirection. Passing it by value is at least as fast, and the compiler does not have to
  assume that the value may change through another alias.
- The 16-byte limit comes from the x86-64 System V calling convention (Linux):
  - A trivially copyable struct of 16 bytes or less is split into up to two 8-byte chunks. Each chunk goes in a
    general-purpose or SSE register, depending on its contents.
  - A struct larger than 16 bytes is passed in memory. The caller copies it onto the stack and the callee reads it from
    there. It is still a by-value copy, just not in registers.
- A type that is not trivially copyable is never passed in registers: the caller creates a temporary copy, by calling
  its copy constructor, and passes its address. Passing it by `const` reference skips that copy and the destructor
  call.
- Passing a big type by value copies it on every call, which may mean allocating memory and copying every element.

**Exceptions**

- Sink parameters (parameters that the function stores) are taken by value and moved into place, even when they are
  big. See [Move semantics](#move-semantics).
- Output and input/output parameters are passed by non-`const` reference (or by pointer if they are optional).
- Parameters of type `ocudulog::basic_logger` are always passed by non-`const` reference. See
  [Const Correctness](5_recommendations.md#const-correctness).

**Notes**

- **Do not** declare parameters passed by value as `const`. The function works on its own copy, so `const` gives no
  guarantee to the caller, it is not part of the function signature, and it prevents moving from the parameter. This is
  consistent with the rule for local variables in [Const Correctness](5_recommendations.md#const-correctness).

**Example**

```cpp
// Bad: small types passed by const reference.
void schedule(const rnti_t& rnti, const unsigned& nof_prbs, const bool& is_retx);

// Bad: a big type passed by value, copying the whole vector on every call.
unsigned count_active_cells(std::vector<cell_configuration> cells);

// Bad: by-value parameters declared const.
void schedule(const rnti_t rnti, const unsigned nof_prbs, const bool is_retx);

// Good.
void     schedule(rnti_t rnti, unsigned nof_prbs, bool is_retx);
unsigned count_active_cells(span<const cell_configuration> cells);
void     apply_config(const du_cell_config& cfg);

// Bad: optional of a small type passed by const reference.
void release_ue(const std::optional<du_ue_index_t>& ue_index);

// Good: optional of a small type passed by value, optional of a big type passed by const reference.
void release_ue(std::optional<du_ue_index_t> ue_index);
void update_cell(const std::optional<cell_configuration>& cell_cfg);

// Good: the same applies to lambdas.
auto is_valid_pci = [](pci_t pci) { return pci < MAX_NOF_PCIS; };
auto log_config   = [&logger](const du_cell_config& cfg) { logger.info("Cell PCI={}", cfg.pci); };
```

---

## Linkage of free functions, variables and constants

This rule applies to free functions (not class methods) and to variables and constants defined at namespace scope
(not class members).

1. **Always use a named namespace.** Define every free function, variable and constant inside a named namespace (e.g.,
   `ocudu` or one of its nested namespaces), never in the global namespace.
2. **In a `.cpp` file, mark them `static`.** Free functions, variables and constants that are only used in that `.cpp`
   file must be declared `static`, which gives them internal linkage.
   - **Do not** put them in an anonymous namespace instead. See
     [Use of Anonymous Namespaces](4_style_aspects_low_level.md#use-of-anonymous-namespaces).
   - **Do not** write `static inline`. `inline` adds nothing to a `static` function.
   - Functions declared in a header file and defined in a `.cpp` file are part of the public interface of the module, so
     they are neither `static` nor `inline`.
3. **In a header file, mark them `inline` or `constexpr`.**
   - Free functions defined in a header file must be `inline` (or `constexpr`, which implies `inline`).
   - Variables and constants defined in a header file must be `inline` or `constexpr`.
   - Helper functions, variables and constants that are only meant to be used by the header itself (e.g., by inline
     functions or templates defined in it) and must not be used from outside must be placed inside a nested namespace
     called `details`.

**Rationale**

- **Named namespaces** avoid name clashes with other libraries and with other modules of the project.
- **`static` in `.cpp` files** keeps helpers private to the file, so they cannot clash with a function of the same name
  in another file. It also lets the compiler warn about unused functions and inline them more aggressively. Unlike an
  anonymous namespace, `static` is visible right at the definition.
- **`inline` in header files**: a header is included in many `.cpp` files. Without `inline`, every one of them gets its
  own definition of the function or variable, and the linker fails with a "multiple definition" error, which violates
  the one definition rule.
- **`details` namespace in header files**: `static` cannot be used to hide a helper in a header, since the header is
  included by other files. The `details` namespace makes it explicit that the helper is an implementation detail of the
  header and not part of its public interface, so it must not be used from outside.

**Example**

```cpp
// --- cell_utils.h ---

// Bad: not inside a named namespace.
inline unsigned nof_subcarriers(unsigned nof_prbs)
{
  return nof_prbs * 12;
}

namespace ocudu {

// Bad: neither inline nor constexpr. Every .cpp file that includes the header defines them, causing a linker error.
unsigned default_nof_prbs = 52;
unsigned nof_subcarriers(unsigned nof_prbs)
{
  return nof_prbs * 12;
}

// Good.
constexpr unsigned NOF_SUBCARRIERS_PER_RB = 12;
inline unsigned    default_nof_prbs       = 52;

inline unsigned nof_subcarriers(unsigned nof_prbs)
{
  return nof_prbs * NOF_SUBCARRIERS_PER_RB;
}

/// Declared here and defined in cell_utils.cpp: neither static nor inline.
bool is_valid_cell_config(const cell_configuration& cfg);

// Bad: helper only used by this header, exposed as part of the public interface.
inline unsigned round_up_to_rb(unsigned nof_subcarriers)
{
  return (nof_subcarriers + NOF_SUBCARRIERS_PER_RB - 1) / NOF_SUBCARRIERS_PER_RB;
}

// Good: helper only used by this header, placed inside the details namespace.
namespace details {

inline unsigned round_up_to_rb(unsigned nof_subcarriers)
{
  return (nof_subcarriers + NOF_SUBCARRIERS_PER_RB - 1) / NOF_SUBCARRIERS_PER_RB;
}

} // namespace details

inline unsigned nof_prbs_for_bandwidth(unsigned nof_subcarriers)
{
  return details::round_up_to_rb(nof_subcarriers);
}

} // namespace ocudu

// --- cell_utils.cpp ---

namespace ocudu {

// Bad: a constant only used in this file that is not static.
constexpr unsigned MAX_NOF_PCIS = 1008;

// Good.
static constexpr unsigned MAX_NOF_PCIS = 1008;

// Bad: anonymous namespace instead of static.
namespace {
bool is_valid_pci(pci_t pci)
{
  return pci < MAX_NOF_PCIS;
}
} // namespace

// Bad: inline adds nothing to a static function.
static inline bool is_valid_pci(pci_t pci)
{
  return pci < MAX_NOF_PCIS;
}

// Good.
static bool is_valid_pci(pci_t pci)
{
  return pci < MAX_NOF_PCIS;
}

bool is_valid_cell_config(const cell_configuration& cfg)
{
  return is_valid_pci(cfg.pci);
}

} // namespace ocudu
```

---

## Move semantics

- Take "sink" parameters (parameters that the function will store) **by value** and `std::move` them into place.
- **Do not** write `return std::move(local);`, as it disables copy elision (NRVO).
- **Do not** use an object after it has been moved from, except to assign a new value to it or destroy it.
- Remember that `std::move` on a `const` object silently performs a copy.
- **Do not** `std::move` objects of trivially-copyable types (integers, enums, `std::chrono` durations, plain structs
  of such types and `std::optional`s of them, etc.). Moving them is exactly the same as copying them, so the
  `std::move` only adds noise and misleads the reader into thinking the source object is no longer valid. clang-tidy
  reports these cases with `performance-move-const-arg`, e.g.: *"std::move of the variable 'x' of the
  trivially-copyable type 'T' has no effect; remove std::move()"*. Only use `std::move` when the type owns resources
  that can actually be transferred (containers, strings, `std::unique_ptr`, etc.), and do not add it "just in case".

**Example**

```cpp
class rrc_ue
{
public:
  // Good: the caller decides whether to copy or move the configuration.
  explicit rrc_ue(rrc_ue_config cfg_) : cfg(std::move(cfg_)) {}

private:
  rrc_ue_config cfg;
};

// Bad: prevents NRVO.
std::vector<int> build()
{
  std::vector<int> v = compute();
  return std::move(v);
}

// Good.
std::vector<int> build()
{
  std::vector<int> v = compute();
  return v;
}

// Bad: v is in a valid but unspecified state after the move.
consume(std::move(v));
fmt::print("{}", v.size());
```

```cpp
// Bad: e1ap_pdcp_sn_status_info is trivially copyable, so std::move has no effect.
std::optional<e1ap_pdcp_sn_status_info> pdcp_sn_status_info = /* ... */;
std::vector<e1ap_cell_group_info_item>  cell_group_info     = /* ... */;

return e1ap_drb_to_setup_item_ng_ran{/* ... */
                                     .cell_group_info     = std::move(cell_group_info),
                                     /* ... */
                                     .pdcp_sn_status_info = std::move(pdcp_sn_status_info)};

// Good: only the type that owns resources (std::vector) is moved.
return e1ap_drb_to_setup_item_ng_ran{/* ... */
                                     .cell_group_info     = std::move(cell_group_info),
                                     /* ... */
                                     .pdcp_sn_status_info = pdcp_sn_status_info};
```

When the value can be written directly in the initializer, prefer that and avoid both the intermediate variable and
the `std::move` (see [Use of designated initializers](3_style_aspects_high_level.md#use-of-designated-initializers)).

---

## `constexpr` and `static_assert`

Check at compile time everything that can be checked at compile time. Use `constexpr` for constants and functions that can be evaluated during
compilation, and `static_assert` to validate assumptions about sizes, ranges and types.

```cpp
static constexpr unsigned MAX_NOF_PRBS = 275;

static constexpr unsigned nof_subcarriers(unsigned nof_prbs)
{
  return nof_prbs * 12;
}

static_assert(nof_subcarriers(MAX_NOF_PRBS) == 3300, "Unexpected maximum number of subcarriers");
static_assert(sizeof(mac_header) == 3, "MAC header must be packed in 3 bytes");
static_assert(std::is_trivially_copyable<iq_sample>::value, "IQ samples are copied with memcpy");
```

Prefer `static_assert` over `ocudu_assert` whenever the condition does not depend on runtime values.

### Do not declare `constexpr` variables as `inline`

**Do not** add `inline` to `constexpr` variables, including the ones defined at namespace scope in header files.

**Rationale**

- A `constexpr` variable is implicitly `const`, so at namespace scope it already has internal linkage: each `.cpp` file
  that includes the header gets its own copy, and there are no multiple definition errors at link time.
- These variables are used as compile-time constants and their address is not taken, so it does not matter that each
  `.cpp` file has its own copy. The compiler replaces each use with the value.
- `inline` only makes all `.cpp` files share a single variable with a single address. This is not needed for constants,
  and it adds noise to the declaration.
- `constexpr` static data members of a class are already implicitly `inline` (C++17), so `inline` is redundant there
  as well.

**Notes**

- Use `inline constexpr` only in the rare case where the variable must have the same address in every `.cpp` file
  (e.g., its address is used as a unique identifier). Document why in that case.

**Example**

```cpp
// Bad: inline is not needed.
inline constexpr uint32_t sst_nof_octets = 1;

// Good.
constexpr uint32_t sst_nof_octets = 1;

struct s_nssai_t {
  // Bad: constexpr static data members are already implicitly inline.
  static inline constexpr uint32_t max_sd = 0xffffff;

  // Good.
  static constexpr uint32_t max_sd = 0xffffff;
};
```

---

## Prefer `std::optional` and `std::variant` over sentinels and unions

Do not encode "no value" with magic sentinel values (`-1`, `0xFFFF`, `nullptr` for value types), and do not use raw `union`s to hold one of several types.

```cpp
// Bad: the caller must know that -1 means "not found".
int find_ue(rnti_t rnti);

// Good: absence is part of the type.
std::optional<du_ue_index_t> find_ue(rnti_t rnti);

// Bad: nothing tells which member of the union is active.
union rrc_message {
  setup_request  setup;
  reestablishment_request reest;
};

// Good: the active alternative is tracked and accessing the wrong one is detected.
using rrc_message = std::variant<setup_request, reestablishment_request>;
```

### Accessing the value of an `std::optional`

Check that the optional has a value, and then access it with `*` and `->` instead of `.value()`. Since the project does
not use exceptions, the exception thrown by `.value()` cannot be handled anyway: the explicit check is what makes the
access safe, and once it is done, `*` and `->` are shorter and clearer.

```cpp
std::optional<du_ue_index_t> ue_index = find_ue(rnti);

// Avoid.
if (ue_index.has_value()) {
  release_ue(ue_index.value());
}

// Preferred.
if (ue_index) {
  release_ue(*ue_index);
}

std::optional<cell_configuration> cell_cfg = get_cell_config(cell_index);
if (cell_cfg) {
  configure_cell(cell_cfg->pci); // Preferred over cell_cfg.value().pci.
}
```

**Common pitfalls**

```cpp
// Bug: if nof_prbs is greater than 255, i wraps around to 0 and the loop never ends.
for (uint8_t i = 0; i != nof_prbs; ++i) {
  // ...
}

// Bug: uint8_t is a character type, so this prints the character with code 65 ("A") instead of "65".
uint8_t mcs = 65;
std::cout << mcs << "\n";

// Surprise: both operands are promoted to int, so the result is -1 and not 255.
uint8_t a = 0;
uint8_t b = 1;
auto    c = a - b; // c is an int with value -1.
```

When converting a fixed-width value received from a message into a generic type (or the other way around), do it once at the boundary of the module (e.g. when decoding or encoding the message) and work with generic types inside the module.

---

## Use `if` statements with initializer

If a variable is only used inside an `if` statement (including its `else` branches), declare it in the `if` itself using
the [init-statement](https://en.cppreference.com/w/cpp/language/if#If_statements_with_initializer) introduced in C++17.
The same applies to `switch` statements.

**Rationale**

- The scope of the variable is limited to where it is used (see [Scope](5_recommendations.md#scope)).
- The variable cannot be used by mistake after the `if`, e.g., an iterator that is `end()`.
- Short-lived names such as `it` can be reused in later `if` statements without clashes.

**Example**

```cpp
// Bad: it remains in scope after the if, although it is not used anymore.
auto it = ues.find(ue_index);
if (it != ues.end()) {
  it->second.handle_rx(pdu);
}

// Good.
if (auto it = ues.find(ue_index); it != ues.end()) {
  it->second.handle_rx(pdu);
}

// Good: also works with optionals and status values.
if (std::optional<du_ue_index_t> ue_index = find_ue(rnti); ue_index) {
  release_ue(*ue_index);
}

// Good: with switch statements.
switch (const pdu_type type = decode_type(pdu); type) {
  case pdu_type::data:
    handle_data(pdu);
    break;
  case pdu_type::control:
    handle_control(pdu);
    break;
}
```

Do not use the init-statement when the variable is needed after the `if`, or when it makes the condition too long to
read in a single glance. In those cases, declare the variable in the line before.

**Guards with early return**

The variable is not considered "needed after the `if`" when the code after the `if` only uses it once, right after a
guard that returns early. In that case, move that use into the `if` body (or an `else` branch) and declare the variable
in the init-statement. This keeps the variable out of the rest of the function, as it is no longer needed there.

```cpp
// Bad: pdu_session_type stays in scope for the rest of the function, although it is not used anymore.
std::optional<pdu_session_type_t> pdu_session_type = asn1_to_pdu_session_type(asn1_item.pdu_session_type, logger);
if (!pdu_session_type) {
  return std::nullopt;
}
item.pdu_session_type = *pdu_session_type;

// Good: the variable is only visible where it is used.
if (std::optional<pdu_session_type_t> pdu_session_type =
        asn1_to_pdu_session_type(asn1_item.pdu_session_type, logger);
    pdu_session_type) {
  item.pdu_session_type = *pdu_session_type;
} else {
  return std::nullopt;
}
```

Keep the early return with the variable declared in the line before when the variable is used more than once after the
guard, or when moving the code into the `if` body would nest more than one level of logic inside it.

---

## Return directly from `switch` statements that translate values

When a function translates a value into another one with a `switch` statement (e.g., converting an enum into its
ASN.1 counterpart), **do not** create a temporary variable that is assigned in each `case` and returned at the end.
Return the translated value directly from each `case` instead.

**Rationale**

- **Less code**: there is no temporary variable and no `break` statements.
- **Safety**: no `case` can forget to assign the variable or fall through to the next one by missing a `break`, and the
  function never returns a default-constructed (and possibly meaningless) value.
- **Readability**: each `case` reads as a direct mapping from the input value to the output value.

**Notes**

- The function that handles invalid values in the `default` branch (e.g., `report_fatal_error`) must be `[[noreturn]]`.
  Otherwise, the compiler warns that control reaches the end of a non-void function.

**Example**

```cpp
// Bad: a temporary variable is assigned in each case and returned at the end.
inline asn1::e1ap::ciphering_algorithm_e
ciphering_algorithm_to_e1ap_asn1(const ocudu::security::ciphering_algorithm& ciph_algo)
{
  asn1::e1ap::ciphering_algorithm_e asn1_ciph_algo;

  switch (ciph_algo) {
    case ocudu::security::ciphering_algorithm::nea0:
      asn1_ciph_algo = asn1::e1ap::ciphering_algorithm_opts::nea0;
      break;
    case ocudu::security::ciphering_algorithm::nea1:
      asn1_ciph_algo = asn1::e1ap::ciphering_algorithm_opts::c_neg128_nea1;
      break;
    case ocudu::security::ciphering_algorithm::nea2:
      asn1_ciph_algo = asn1::e1ap::ciphering_algorithm_opts::c_neg128_nea2;
      break;
    case ocudu::security::ciphering_algorithm::nea3:
      asn1_ciph_algo = asn1::e1ap::ciphering_algorithm_opts::c_neg128_nea3;
      break;
    default:
      report_fatal_error("Invalid ciphering algorithm ({})", ciph_algo);
      break;
  }

  return asn1_ciph_algo;
}

// Good: each case returns the translated value directly.
inline asn1::e1ap::ciphering_algorithm_e
ciphering_algorithm_to_e1ap_asn1(const ocudu::security::ciphering_algorithm& ciph_algo)
{
  switch (ciph_algo) {
    case ocudu::security::ciphering_algorithm::nea0:
      return asn1::e1ap::ciphering_algorithm_opts::nea0;
    case ocudu::security::ciphering_algorithm::nea1:
      return asn1::e1ap::ciphering_algorithm_opts::c_neg128_nea1;
    case ocudu::security::ciphering_algorithm::nea2:
      return asn1::e1ap::ciphering_algorithm_opts::c_neg128_nea2;
    case ocudu::security::ciphering_algorithm::nea3:
      return asn1::e1ap::ciphering_algorithm_opts::c_neg128_nea3;
    default:
      report_fatal_error("Invalid ciphering algorithm ({})", ciph_algo);
  }
}
```

---

## Use `std::to_array` to define constant lookup tables

When defining a constant array whose contents are listed in the initializer (e.g., a table that maps enum values to
their ASN.1 counterparts), use `ocudu::to_array` (`ocudu/adt/to_array.h`) instead of writing the size of the
`std::array` by hand. Do not use `std::to_array`: it is C++20 and the project is built as C++17.

**Rationale**

- **The size is deduced**: the size of the array always matches the number of entries, so adding or removing an entry
  does not require updating a number somewhere else.
- **Safety**: if the explicit size of an `std::array` is larger than the number of entries, the code still compiles and
  the remaining elements are value-initialized (e.g., `{0, 0}` pairs). A lookup can then silently match one of these
  fake entries. With `std::to_array`, the array contains exactly the listed entries.
- **Readability**: `std::array` needs an extra pair of braces around the entries, because it wraps a C array.
  `std::to_array` takes the list of entries directly.

**Notes**

- The element type must be given as a template argument when the entries are braced lists (e.g., `{a, b}`), since
  their type cannot be deduced.
- Make the table `constexpr` whenever its element type allows it (see
  [`constexpr` and `static_assert`](#constexpr-and-static_assert)).
- `ocudu::to_array` is the C++17 counterpart of `std::to_array`; it has the same call syntax. Once the project moves to
  C++20, this rule switches to `std::to_array` and the helper is removed.

**Example**

```cpp
// Bad: the size is written by hand, and the extra braces are needed.
static const std::array<std::pair<pdcp_discard_timer, asn1::e1ap::discard_timer_opts::options>, 17>
    pdcp_discard_timer_mappings = {{
        {pdcp_discard_timer::ms10, asn1::e1ap::discard_timer_opts::ms10},
        {pdcp_discard_timer::ms20, asn1::e1ap::discard_timer_opts::ms20},
        // ...
    }};

// Good: the size is deduced from the number of entries.
static constexpr auto pdcp_discard_timer_mappings =
    ocudu::to_array<std::pair<pdcp_discard_timer, asn1::e1ap::discard_timer_opts::options>>({
        {pdcp_discard_timer::ms10, asn1::e1ap::discard_timer_opts::ms10},
        {pdcp_discard_timer::ms20, asn1::e1ap::discard_timer_opts::ms20},
        // ...
    });
```

---

## Replace C-style casts with `static_cast`

**Do not** use C-style casts (`(T)value`) or functional-style casts (`T(value)`, which behave exactly like a C-style
cast). Use `static_cast<T>(value)` for conversions between types, such as integer conversions, enum to integer
conversions and vice versa, or conversions between floating-point and integer types. This complements
[Using C++ Casts](4_style_aspects_low_level.md#using-c-casts).

When `static_cast` is not enough:

- Use `reinterpret_cast` only to reinterpret raw memory (e.g., viewing a buffer as bytes), and document why it is
  needed.
- Avoid `const_cast`. If it is really needed (e.g., to call a legacy API that is not `const` correct), document why.
- Do not use `dynamic_cast`, since RTTI is disabled (see
  [Avoid RTTI and Exceptions](2_mechanical_source_aspects.md#avoid-rtti-and-exceptions)).

**Rationale**

- **Safety**: a C-style cast silently falls back to `const_cast` or `reinterpret_cast` when a `static_cast` is not
  possible, e.g., casting away `const` or converting between unrelated pointer types. `static_cast` refuses these
  conversions and the compiler reports an error.
- **Intent**: the name of the cast tells the reader what kind of conversion is done.
- **Searchability**: C++ casts are easy to find with a text search or with tools such as clang-tidy
  (`cppcoreguidelines-pro-type-cstyle-cast`, `google-readability-casting`).

**Example**

```cpp
// Bad: C-style and functional-style casts.
unsigned nof_symbols = (unsigned)nof_re / nof_subcarriers;
uint8_t  mcs_index   = uint8_t(mcs);
float    ratio       = (float)nof_prbs / total_prbs;

// Good.
unsigned nof_symbols = static_cast<unsigned>(nof_re) / nof_subcarriers;
uint8_t  mcs_index   = static_cast<uint8_t>(mcs);
float    ratio       = static_cast<float>(nof_prbs) / total_prbs;

// Bad: the C-style cast silently removes const. Modifying cfg is undefined behavior if the original object is const.
const cell_configuration& cell_cfg = get_cell_config();
cell_configuration*       cfg      = (cell_configuration*)&cell_cfg;

// Good: static_cast does not compile here, which makes the mistake visible.
cell_configuration* cfg = static_cast<cell_configuration*>(&cell_cfg); // Compilation error.
```
