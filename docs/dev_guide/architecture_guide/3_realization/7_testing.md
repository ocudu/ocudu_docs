# Testing

OCUDU operates a multi-level testing strategy. Minimising internal dependencies inside components directly enables each level:

| Level | Scope |
|---|---|
| **Unit tests** | A single class or function in isolation |
| **Component tests** | A subsystem (e.g. MAC scheduler) with mocked neighbours |
| **Integration tests** | Multiple layers interacting through real interfaces |
| **E2E tests** | Full stack with real radio or simulated RF |


See [Testing policy](../../testing_policy/index.md) for more details.