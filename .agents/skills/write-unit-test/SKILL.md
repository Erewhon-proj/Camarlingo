---
name: write-unit-test
description: Write or extend unit tests in Rust (rstest, mockall) or TypeScript (Vitest), following Arrange-Act-Assert with parametrized cases and mocks. Use when new or changed logic needs tests, when coverage drops, or when the user asks for unit tests.
metadata:
  version: "1.0"
---

# Write unit tests

Tests that a reader understands in seconds: one behaviour per test, three visible parts, every
branch of the code under test reached by at least one case.

## Rules for every language

1. **Arrange, Act, Assert.** Every test body has the three comments `arrange`, `act`, `assert`,
   in this order, each followed by its code. When the starting state matters, assert it right
   after arrange (Arrange, Assert, Act, Assert) and keep the comments. The comments are required
   even in short tests. Given, When, Then belongs to end-to-end tests, not here.
2. **One case per branch.** List the branches of the function first (`if`/`else`, `match` arms,
   early returns, errors). Every branch gets at least one case; boundaries (zero, one, maximum,
   empty) get their own.
3. **Parametrize instead of copying.** Cases that differ only in data go in one parametrized
   test, each case named after what it checks.
4. **Mock only side effects.** Clock, file system, mail, database and random numbers are
   replaced through the trait or interface the code already depends on. Pure logic is tested
   with real values. After a mock, also check how it was called (how many times, with what).
5. **Names say the behaviour**: `<unit>_<condition>_<expected result>`, for example
   `allocate_with_remainder_gives_extra_cent_to_lowest_unit_id`.
6. **No magic numbers.** Give amounts and ids a name (`const TOTAL: Cents = Cents(100_00)`) when
   they appear more than once or their meaning is not obvious.
7. **Types everywhere**, also in tests: typed helpers, typed fixtures, no `any`.
8. **Money is `Cents`.** Never build an expected amount with floating point.
9. **Deterministic.** No real time, no network, no order dependence between tests.

## Rust

- Unit tests: a `#[cfg(test)] mod tests` at the bottom of the file under test.
  Tests that cross crate boundaries: `crates/<crate>/tests/<feature>.rs`.
- Parametrized: `rstest` with one `#[case::<name>(...)]` per case. A test with no cases or
  fixtures uses plain `#[test]`.
- Mocks: `mockall` on the trait (`#[cfg_attr(test, mockall::automock)]`); check calls with
  `.times(n)` and `.withf(...)`.
- Invariants over many inputs (an allocation always sums to its total): `proptest`.
- Errors: assert the exact variant with `assert!(matches!(result, Err(Error::Variant { .. })))`.

```rust
#[rstest]
#[case::even_split(Cents(300), &[1, 1, 1], &[Cents(100), Cents(100), Cents(100)])]
#[case::remainder_to_lowest_id(Cents(100), &[1, 1, 1], &[Cents(34), Cents(33), Cents(33)])]
fn allocate_splits_total_by_shares(
    #[case] total: Cents,
    #[case] shares: &[u32],
    #[case] expected: &[Cents],
) {
    // arrange
    let units = units_with_shares(shares);

    // act
    let result = allocate(total, &units);

    // assert
    assert_eq!(result.amounts(), expected);
}

#[test]
fn send_reminder_calls_notifier_once_per_debtor() {
    // arrange
    let mut notifier = MockNotifier::new();
    notifier.expect_send().times(1).returning(|_| Ok(()));
    let service = ReminderService::new(notifier);

    // act
    let sent = service.send_all(&[debtor("A1")]);

    // assert
    assert_eq!(sent, Ok(1));
}
```

Run: `cargo test -p <crate>`; coverage: `cargo llvm-cov -p <crate> --html`.

## Svelte and TypeScript (Vitest)

- Test file next to the module: `<module>.test.ts`.
- One `describe` per function under test, one `it` per behaviour.
- Parametrized: `it.each` with an array of objects, one field per input plus `expected`, and
  `$name` in the title.
- Mocks and spies: `vi.fn()`, `vi.spyOn()`, `vi.mock()`; restore them in `afterEach`.
- The frontend holds no business logic, so its tests cover formatting, state and the calls it
  makes to the backend (mocked).

```ts
describe('formatCents', () => {
  it.each([
    { name: 'zero', cents: 0, expected: '0,00' },
    { name: 'thousands separator', cents: 123456, expected: '1.234,56' },
  ])('formats $name', ({ cents, expected }) => {
    // arrange
    const value: number = cents;

    // act
    const text = formatCents(value);

    // assert
    expect(text).toBe(expected);
  });
});
```

Run: `npx vitest run --coverage`.

## Done when

- Every branch of the code under test has a case, and the new tests pass.
- Coverage of the changed files does not go down, and the project threshold still holds.
- Lint passes on the test files too.
- Report to the user: tests added (one line each), branches covered, anything left untested
  and why.
