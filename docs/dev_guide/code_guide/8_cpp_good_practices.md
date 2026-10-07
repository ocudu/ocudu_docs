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

## Move semantics

- Take "sink" parameters (parameters that the function will store) **by value** and `std::move` them into place.
- **Do not** write `return std::move(local);`, as it disables copy elision (NRVO).
- **Do not** use an object after it has been moved from, except to assign a new value to it or destroy it.
- Remember that `std::move` on a `const` object silently performs a copy.

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
