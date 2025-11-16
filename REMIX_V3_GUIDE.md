# Remix v3 EXPERIMENTAL Component Model Guide

A comprehensive guide based on building a todo app with async data fetching. **This stuff is likely to change!!

## Table of Contents

1. [Component Structure](#component-structure)
2. [The Two-Phase Lifecycle](#the-two-phase-lifecycle)
3. [Props and Closures](#props-and-closures)
4. [Reactivity with Events](#reactivity-with-events)
5. [Context Sharing](#context-sharing)
6. [Async Data Fetching](#async-data-fetching)
7. [Common Patterns](#common-patterns)
8. [Common Pitfalls](#common-pitfalls)

---

## Component Structure

Remix v3 components have a unique structure with two functions:

```tsx
export function MyComponent(this: Remix.Handle, { someProp }: Props) {
  // 🏗️ SETUP PHASE (runs ONCE when component is created)
  // - Initialize variables
  // - Set up event listeners
  // - Access context

  return (props) => { // can also access the props here to get a reactive version of them
    // 🎨 RENDER PHASE (runs on EVERY render)
    // - Return JSX
    // - Read current state
    // - Compute derived values
  };
}
```

### Key Points

- **Outer function**: Runs once during component initialization
- **Inner function**: Runs on every render
- **`this` context**: Provides access to Remix Handle API (`this.update()`, `this.context`, etc.)

---

## The Two-Phase Lifecycle

### Setup Phase (Outer Function)

```tsx
export function TodoItem(this: Remix.Handle, { todoId }: Props) {
  const store = this.context.get(App); // ✅ Get context once

  // ✅ Set up event listeners once
  events(store, [TodoStore.todosChanged(() => this.update())]);

  return () => { /* render */ };
}
```

**What happens here:**
- Component instance is created
- Props are captured in a closure
- Event listeners are registered
- Context is retrieved

### Render Phase (Inner Function)

```tsx
return () => {
  const todo = store.todos.find(t => t.id === todoId); // ✅ Read fresh data
  if (!todo) return null;

  return <li>{todo.text}</li>; // ✅ Return JSX
};
```

**What happens here:**
- Called on every `this.update()`
- Reads current state from store/context
- Returns JSX to render

---

## Props and Closures

### ⚠️ The Stale Props Problem

Props are captured in the outer function's closure and **never update**:

```tsx
// ❌ BROKEN: Props get stale
export function TodoItem(this: Remix.Handle, { todoId }: Props) {
  const store = this.context.get(App);

  // TodoItem listens to changes and re-renders
  events(store, [TodoStore.todosChanged(() => this.update())]);

  return () => {
    // ❌ todoId is from the original props, never updates!
    const todo = store.todos.find(t => t.id === todoId);
    return todo ? <li>{todo.text}</li> : null;
  };
}
```

**What goes wrong:**
1. Component created with `todoId: 1`
2. Parent deletes that todo and re-renders
3. Remix reuses the component at the same position
4. Component still has `todoId: 1` in its closure
5. Component looks for non-existent todo and returns `null`

### ✅ Solution 1: Pass Props to Render Function

```tsx
export function TodoItem(this: Remix.Handle) {
  const store = this.context.get(App);
  events(store, [TodoStore.todosChanged(() => this.update())]);

  // ✅ Receive props fresh on each render
  return ({ todoId }: Props) => {
    const todo = store.todos.find(t => t.id === todoId);
    return todo ? <li>{todo.text}</li> : null;
  };
}
```

### ✅ Solution 2: Index-Based Props

```tsx
// Parent passes stable index
<TodoItem key={index} index={index} />

// Child uses index to look up fresh data
export function TodoItem(this: Remix.Handle, { index }: Props) {
  const store = this.context.get(App);
  events(store, [TodoStore.todosChanged(() => this.update())]);

  return () => {
    // ✅ index is stable, but data is fresh
    const todo = store.todos[index];
    return todo ? <li>{todo.text}</li> : null;
  };
}
```

### ✅ Solution 3: Inline Rendering

```tsx
// No child component = no closure problem
return () => (
  <ul>
    {store.todos.map(todo => (
      <li key={todo.id}>{todo.text}</li>
    ))}
  </ul>
);
```

---

## Reactivity with Events

Remix v3 uses the DOM's `EventTarget` API for reactivity:

### Creating a Reactive Store

```tsx
import { createEventType } from "@remix-run/events";

// 1. Create event type
const [todosChanged, createTodosChanged] = createEventType("todos:changed");

// 2. Extend EventTarget
export class TodoStore extends EventTarget {
  todos: Todo[] = [];

  addTodo(text: string) {
    this.todos.push({ id: Date.now(), text, completed: false });
    // 3. Dispatch event on changes
    this.dispatchEvent(createTodosChanged());
  }

  // 4. Export event type for consumers
  static todosChanged = todosChanged;
}
```

### Listening to Store Changes

```tsx
export function TodoList(this: Remix.Handle) {
  const store = this.context.get(App);

  // Listen to store changes and re-render
  events(store, [TodoStore.todosChanged(() => this.update())]);

  return () => (
    <ul>
      {store.todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
    </ul>
  );
}
```

---

## Context Sharing

Share state between components using `this.context`:

### Setting Context (Parent)

```tsx
export function App(this: Remix.Handle<TodoStore>) {
  const store = new TodoStore();

  // ✅ Make store available to all children
  this.context.set(store);

  return () => (
    <div>
      <TodoList />
      <AddTodoForm />
    </div>
  );
}
```

### Accessing Context (Child)

```tsx
export function TodoList(this: Remix.Handle) {
  // ✅ Get parent's store
  const store = this.context.get(App);

  return () => (
    <ul>
      {store.todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
    </ul>
  );
}
```

---

## Async Data Fetching

### Using `this.queueTask()`

```tsx
export function Posts(this: Remix.Handle) {
  // 1. Declare state variables in component scope
  const posts: Post[] = [];
  let loading = false;
  let error: Error | null = null;

  // 2. Queue async task (doesn't block rendering)
  this.queueTask(async () => {
    loading = true;
    this.update(); // Show loading state

    try {
      const data = await fetch('/api/posts').then(res => res.json());
      posts.push(...data);
      loading = false;
      this.update(); // Show loaded data
    } catch (err) {
      error = err as Error;
      loading = false;
      this.update(); // Show error
    }
  });

  // 3. Render based on current state
  return () => (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {posts.map(post => <div key={post.id}>{post.title}</div>)}
    </div>
  );
}
```

### Key Points

- **Don't `await` in the outer function** - it would block component initialization
- **Use `this.queueTask()`** - runs async work in the background
- **Store data in component scope** - captured in closure, accessible to render function
- **Call `this.update()`** - triggers re-render when data changes
- **Render function reads current state** - shows loading/error/success states

---

## Common Patterns

### Pattern 1: Local Component State

```tsx
export function Counter(this: Remix.Handle) {
  let count = 0; // Local state

  return () => (
    <button on={pressDown(() => {
      count++;
      this.update(); // Re-render with new count
    })}>
      Count: {count}
    </button>
  );
}
```

### Pattern 2: Reactive Form Input

```tsx
export function SearchBox(this: Remix.Handle) {
  let query = "";

  return () => (
    <input
      value={query}
      on={dom.input((event) => {
        query = event.currentTarget.value;
        this.update();
      })}
    />
  );
}
```

### Pattern 3: Computed Values

```tsx
return () => {
  const completed = store.todos.filter(t => t.completed).length;
  const total = store.todos.length;
  const percentage = total ? (completed / total) * 100 : 0;

  return <div>{percentage.toFixed(0)}% complete</div>;
};
```

### Pattern 4: Conditional Rendering

```tsx
return () => {
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (items.length === 0) return <EmptyState />;

  return <ItemList items={items} />;
};
```

---

## Common Pitfalls

### ❌ Pitfall 1: Expecting Props to Update

```tsx
// ❌ WRONG: todoId never updates
export function TodoItem(this: Remix.Handle, { todoId }: Props) {
  return () => {
    const todo = findTodoById(todoId); // Stale todoId!
    // ...
  };
}

// ✅ RIGHT: Accept props in render function
export function TodoItem(this: Remix.Handle) {
  return ({ todoId }: Props) => {
    const todo = findTodoById(todoId); // Fresh todoId!
    // ...
  };
}
```

### ❌ Pitfall 2: Forgetting to Call `this.update()`

```tsx
// ❌ WRONG: UI won't update
export function Counter(this: Remix.Handle) {
  let count = 0;

  return () => (
    <button on={pressDown(() => {
      count++; // Changes state but doesn't re-render!
    })}>
      {count}
    </button>
  );
}

// ✅ RIGHT: Call this.update()
export function Counter(this: Remix.Handle) {
  let count = 0;

  return () => (
    <button on={pressDown(() => {
      count++;
      this.update(); // Trigger re-render
    })}>
      {count}
    </button>
  );
}
```

### ❌ Pitfall 4: Blocking Async Operations

```tsx
// ❌ WRONG: Awaiting in outer function blocks initialization
export async function App(this: Remix.Handle) {
  const data = await fetch('/api/data'); // Blocks everything!
  return () => <div>{data}</div>;
}

// ✅ RIGHT: Use this.queueTask()
export function App(this: Remix.Handle) {
  let data = null;

  this.queueTask(async () => {
    data = await fetch('/api/data');
    this.update();
  });

  return () => <div>{data || 'Loading...'}</div>;
}
```

---

## Summary

### Key Takeaways

1. **Two-phase lifecycle**: Setup once, render many times
2. **Props are captured**: They don't update unless passed to render function
3. **Manual reactivity**: Call `this.update()` when state changes
4. **Event-based**: Use EventTarget for store changes
5. **Context for sharing**: Use `this.context` to share state across components
6. **Async with queueTask**: Non-blocking async operations with `this.queueTask()`

### Mental Model

Think of Remix v3 components like this:

```
Component Instance (created once)
  ├─ Setup Phase (outer function)
  │   ├─ Captures props in closure
  │   ├─ Sets up event listeners
  │   └─ Returns render function
  │
  └─ Render Phase (inner function)
      ├─ Called on every this.update()
      ├─ Reads fresh data from stores/context
      └─ Returns JSX
```

The render function is like a "snapshot" generator - it reads the current state and generates UI. When you call `this.update()`, it takes a new snapshot with the latest data.

---
