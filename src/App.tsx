import type { Remix } from "@remix-run/dom";
import { pressDown } from "@remix-run/events/press";

export function App(this: Remix.Handle<{ someContextValue: string }>) {
	let count = 0;

	this.context.set({
		someContextValue: "hello from context",
	});

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

	return () => <div>I'm a child component {someProp} </div>;
}
