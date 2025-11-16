import type { Remix } from "@remix-run/dom";
import { createEventType, events } from "@remix-run/events";
import { pressDown } from "@remix-run/events/press";

const [change, createChange] = createEventType("ctx:change");

class CTX extends EventTarget {
	someContextValue = "default value";

	updateSomeContextValue(newValue: string) {
		this.someContextValue = newValue;
		this.dispatchEvent(createChange());
	}

	static change = change;
}

export function App(this: Remix.Handle<CTX>) {
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
	const context = this.context.get(App);

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
