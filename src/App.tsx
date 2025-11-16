import type { Remix } from "@remix-run/dom";
import { pressDown } from "@remix-run/events/press";

export function App(this: Remix.Handle) {
	let count = 0;

	return () => (
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
	);
}
