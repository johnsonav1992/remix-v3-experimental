import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";
import { events } from "@remix-run/events";
import { pressDown } from "@remix-run/events/press";
import { App } from "./App";
import { TodoStore } from "./TodoStore";

export type TodoItemProps = {
	index: number;
};

export function TodoItem(this: Remix.Handle, { index }: TodoItemProps) {
	const store = this.context.get(App);

	// Listen to store changes so we re-render when todos change
	events(store, [TodoStore.todosChanged(() => this.update())]);

	return () => {
		// Look up the todo at this index in the CURRENT store state
		const todo = store.todos[index];
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
					on={dom.input(() => {
						store.toggleTodo(todo.id);
					})}
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
					on={pressDown((event) => {
						event.stopPropagation();
						event.preventDefault();
						store.deleteTodo(todo.id);
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
