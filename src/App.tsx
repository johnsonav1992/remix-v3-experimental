import type { Remix } from "@remix-run/dom";
import { createEventType, events } from "@remix-run/events";
import { pressDown } from "@remix-run/events/press";
import { TodoStore } from "./TodoStore";

const [ctxChange, createCtxChange] = createEventType("ctx:change");

class CTX extends EventTarget {
	someContextValue = "default value";

	updateSomeContextValue(newValue: string) {
		this.someContextValue = newValue;
		this.dispatchEvent(createCtxChange());
	}

	static change = ctxChange;
}

export function DemoApp(this: Remix.Handle<CTX>) {
	let count = 0;
	const ctx = new CTX();

	this.context.set(ctx);

	events(ctx, [CTX.change(() => this.update())]);

	return () => (
		<>
			<button
				type="button"
				on={pressDown(() => {
					count++;
					count++;
					this.update();
				})}
			>
				Click Me {count}
			</button>
			{ctx.someContextValue}
			<ChildComponent someProp="hey" />
		</>
	);
}

type ChildProps = {
	someProp: string;
};

function ChildComponent(this: Remix.Handle, { someProp }: ChildProps) {
	const context = this.context.get(DemoApp);

	console.log(context.someContextValue);

	return () => (
		<div>
			I'm a child component {someProp} {context.someContextValue}
			<button
				css={{
					color: "red",
					backgroundColor: "black",
					padding: "8px",
				}}
				type="button"
				on={pressDown(() => {
					context.updateSomeContextValue("updated value");
					console.log(context.someContextValue);
					this.update();
				})}
			>
				Update ctx
			</button>
		</div>
	);
}

// ============================================
// TODO APP
// ============================================

function AddTodoFormInternal(this: Remix.Handle) {
	const store = this.context.get(App);
	let inputValue = "";

	return () => (
		<form
			css={{
				display: "flex",
				gap: "8px",
				marginBottom: "24px",
			}}
		>
			<input
				type="text"
				value={inputValue}
				on={{
					type: "input",
					handler: (event) => {
						inputValue = event.target.value;
						this.update();
					},
				}}
				placeholder="What needs to be done?"
				css={{
					flex: 1,
					padding: "12px",
					fontSize: "16px",
					border: "2px solid #e0e0e0",
					borderRadius: "4px",
					outline: "none",
				}}
			/>
			<button
				type="button"
				on={pressDown(() => {
					if (inputValue.trim()) {
						store.addTodo(inputValue);
						inputValue = "";
						this.update();
					}
				})}
				css={{
					padding: "12px 24px",
					fontSize: "16px",
					backgroundColor: "#4CAF50",
					color: "white",
					border: "none",
					borderRadius: "4px",
					cursor: "pointer",
				}}
			>
				Add
			</button>
		</form>
	);
}

function TodoItemInternal(
	this: Remix.Handle,
	{ todoId }: { todoId: number },
) {
	const store = this.context.get(App);

	events(store, [TodoStore.todosChanged(() => this.update())]);

	return () => {
		const todo = store.todos.find((t) => t.id === todoId);
		if (!todo) return null;

		return (
			<li
				css={{
					display: "flex",
					alignItems: "center",
					gap: "12px",
					padding: "16px",
					backgroundColor: "white",
					borderRadius: "4px",
					boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
					marginBottom: "8px",
				}}
			>
				<input
					type="checkbox"
					checked={todo.completed}
					on={{
						type: "change",
						handler: () => {
							store.toggleTodo(todoId);
						},
					}}
					css={{
						width: "20px",
						height: "20px",
						cursor: "pointer",
					}}
				/>
				<span
					css={{
						flex: 1,
						fontSize: "16px",
						textDecoration: todo.completed ? "line-through" : "none",
						color: todo.completed ? "#999" : "#333",
					}}
				>
					{todo.text}
				</span>
				<button
					type="button"
					on={pressDown(() => {
						store.deleteTodo(todoId);
					})}
					css={{
						padding: "6px 12px",
						backgroundColor: "#f44336",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
					}}
				>
					Delete
				</button>
			</li>
		);
	};
}

function TodoListInternal(this: Remix.Handle) {
	const store = this.context.get(App);

	events(store, [TodoStore.todosChanged(() => this.update())]);

	return () => (
		<ul
			css={{
				listStyle: "none",
				padding: 0,
				margin: 0,
			}}
		>
			{store.todos.length === 0 ? (
				<li
					css={{
						textAlign: "center",
						padding: "32px",
						color: "#999",
						fontSize: "18px",
					}}
				>
					No todos yet. Add one above!
				</li>
			) : (
				store.todos.map((todo) => (
					<TodoItemInternal key={todo.id} todoId={todo.id} />
				))
			)}
		</ul>
	);
}

export function App(this: Remix.Handle<TodoStore>) {
	const store = new TodoStore();

	this.context.set(store);

	events(store, [TodoStore.todosChanged(() => this.update())]);

	return () => (
		<div
			css={{
				maxWidth: "600px",
				margin: "0 auto",
				padding: "32px",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<h1
				css={{
					textAlign: "center",
					color: "#333",
					marginBottom: "32px",
					fontSize: "36px",
				}}
			>
				Remix v3 Todo App
			</h1>
			<AddTodoFormInternal />
			<TodoListInternal />
			<div
				css={{
					marginTop: "24px",
					textAlign: "center",
					color: "#666",
					fontSize: "14px",
				}}
			>
				{store.todos.filter((t) => !t.completed).length} items left
			</div>
		</div>
	);
}
