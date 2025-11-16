import type { Remix } from "@remix-run/dom";
import { events } from "@remix-run/events";
import { App } from "./App";
import { TodoItem } from "./TodoItem";
import { TodoStore } from "./TodoStore";

export function TodoList(this: Remix.Handle) {
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
				store.todos.map((_, index) => (
					<TodoItem key={index} index={index} />
				))
			)}
		</ul>
	);
}
