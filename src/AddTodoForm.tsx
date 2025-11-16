import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";
import { pressDown } from "@remix-run/events/press";
import { App } from "./App";

export function AddTodoForm(this: Remix.Handle) {
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
				on={dom.input((event) => {
					inputValue = event.currentTarget.value;
					this.update();
				})}
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
