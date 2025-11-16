import { createEventType } from "@remix-run/events";

export type Todo = {
	id: number;
	text: string;
	completed: boolean;
};

// Create custom event types for todo operations
const [todosChanged, createTodosChanged] = createEventType("todos:changed");

export class TodoStore extends EventTarget {
	todos: Todo[] = [];
	nextId = 1;

	addTodo(text: string) {
		console.log("adding");
		this.todos.push({
			id: this.nextId++,
			text,
			completed: false,
		});
		console.log(this.todos);
		this.dispatchEvent(createTodosChanged());
	}

	toggleTodo(id: number) {
		const todo = this.todos.find((t) => t.id === id);
		if (todo) {
			todo.completed = !todo.completed;
			this.dispatchEvent(createTodosChanged());
		}
	}

	deleteTodo(id: number) {
		console.log(id);
		this.todos = this.todos.filter((t) => t.id !== id);
		console.log(this.todos);
		this.dispatchEvent(createTodosChanged());
	}

	static todosChanged = todosChanged;
}
