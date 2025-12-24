# Async/Await Best Practices

Summary of patterns for safe async/await usage in JavaScript, based on [Rethinking async loops in JavaScript](https://allthingssmitty.com/2025/10/20/rethinking-async-loops-in-javascript/).

## The Problem: Sequential Execution in Loops

Using `await` inside a `for` loop runs operations sequentially:

```js
for (const id of users) {
  const user = await fetchUser(id); // Each call waits for the previous
}
```

This is fine when order matters, but inefficient for independent operations.

## Common Pitfalls

### Don't `await` inside `map()` without handling promises

```js
// ❌ Returns array of promises, not results
const results = users.map(async (id) => {
  const user = await fetchUser(id);
  return user;
});
```

The promises are created but not awaited, so `results` contains `[Promise, Promise, Promise]` instead of actual data.

### Never use `await` in `forEach()`

```js
// ❌ forEach doesn't wait for async callbacks
users.forEach(async (id) => {
  const user = await fetchUser(id); // Not awaited properly
});
```

The loop doesn't wait, and async work may complete after the function finishes, leading to silent bugs.

## Safe Patterns

### Sequential execution: `for...of` + `await`

Use when:

- Order matters
- API rate limits require sequential calls
- Operations depend on previous results

```js
for (const id of users) {
  const user = await fetchUser(id);
  console.log(user);
}
```

**Pros:** Maintains order, useful for rate-limiting  
**Cons:** Slower for independent operations

### Parallel execution: `Promise.all()` + `map()`

Use when:

- Operations are independent
- Speed is important
- All operations must succeed

```js
const usersData = await Promise.all(users.map((id) => fetchUser(id)));
```

**Pros:** Much faster for I/O-heavy tasks  
**Cons:** One rejection fails the entire batch

### Handle `Promise.all()` failures

`Promise.all()` fails fast—a single rejection causes the whole operation to fail, discarding successful results.

**Option 1: Use `Promise.allSettled()`**

```js
const results = await Promise.allSettled(users.map((id) => fetchUser(id)));

results.forEach((result) => {
  if (result.status === 'fulfilled') {
    console.log('✅ User:', result.value);
  } else {
    console.warn('❌ Error:', result.reason);
  }
});
```

**Option 2: Handle errors inside the mapping function**

```js
const results = await Promise.all(
  users.map(async (id) => {
    try {
      return await fetchUser(id);
    } catch (err) {
      console.error(`Failed to fetch user ${id}`, err);
      return { id, name: 'Unknown User' }; // fallback
    }
  })
);
```

This prevents unhandled promise rejections and provides graceful degradation.

### Controlled concurrency: Throttled parallelism

Use tools like `p-limit` when you need speed but must respect API limits:

```js
import pLimit from 'p-limit';

const limit = pLimit(2); // Run 2 fetches at a time
const limitedFetches = users.map((id) => limit(() => fetchUser(id)));

const results = await Promise.all(limitedFetches);
```

**Pros:** Balance between concurrency and control, prevents overloading services  
**Cons:** Adds dependency

## Concurrency Levels Comparison

| Goal                       | Pattern                        | Concurrency        |
| -------------------------- | ------------------------------ | ------------------ |
| Keep order, run one-by-one | `for...of` + `await`           | 1                  |
| Run all at once, no order  | `Promise.all()` + `map()`      | ∞ (unbounded)      |
| Limit concurrency          | `p-limit`, `PromisePool`, etc. | N (custom-defined) |

## Key Takeaways

1. **Structure async logic based on your needs:**
   - Order → `for...of`
   - Speed → `Promise.all()`
   - Safety → `allSettled()` / `try-catch`
   - Balance → `p-limit`, etc.

2. **For I/O-heavy operations** (like API calls), parallelism can dramatically reduce total execution time.

3. **For short, CPU-bound tasks**, parallelism may not make a noticeable difference.

4. **Always handle errors** to prevent unhandled promise rejections, especially in Node.js with `--unhandled-rejections=strict`.

## References

- [Rethinking async loops in JavaScript](https://allthingssmitty.com/2025/10/20/rethinking-async-loops-in-javascript/)
- Consider `Array.fromAsync()` for consuming async data sources like streams and generators
