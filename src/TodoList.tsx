import type { Remix } from "@remix-run/dom";
import { TodoItem } from "./TodoItem";
import type { TodoStore } from "./TodoStore";

type TodoListProps = {
	store: TodoStore;
};

export function TodoList(this: Remix.Handle, { store }: TodoListProps) {
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
					<TodoItem key={todo.id} todoId={todo.id} store={store} />
				))
			)}
		</ul>
	);
}
