import type { Remix } from "@remix-run/dom";
import { createEventType, events } from "@remix-run/events";
import { pressDown } from "@remix-run/events/press";
import { AddTodoForm } from "./components/AddTodoForm";
import { Posts } from "./components/Posts";
import { TodoList } from "./components/TodoList";
import { TodoStore } from "./store/TodoStore";

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
			<AddTodoForm />
			<TodoList />
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
			<Posts />
		</div>
	);
}
