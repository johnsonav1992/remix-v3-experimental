import type { Remix } from "@remix-run/dom";

type Post = {
	id: number;
	title: string;
	body: string;
	userId: number;
};

export function Posts(this: Remix.Handle) {
	const posts: Post[] = [];
	let loading = false;
	let error: Error | null = null;

	this.queueTask(async () => {
		loading = true;
		this.update();

		try {
			const res = await fetch(
				"https://jsonplaceholder.typicode.com/todos?_limit=5",
			).then((res) => res.json());

			posts.push(...res);
			loading = false;

			this.update();
		} catch (err) {
			error = err as Error;
			loading = false;

			this.update();
		}
	});

	return () => (
		<div
			css={{
				marginTop: "32px",
				padding: "16px",
				backgroundColor: "#f9f9f9",
				borderRadius: "8px",
			}}
		>
			<h2
				css={{
					fontSize: "20px",
					marginBottom: "16px",
					color: "#333",
				}}
			>
				External Posts
			</h2>

			{loading && (
				<p
					css={{
						color: "#666",
						fontStyle: "italic",
					}}
				>
					Loading posts...
				</p>
			)}

			{error && (
				<p
					css={{
						color: "#f44336",
					}}
				>
					Error: {error.message}
				</p>
			)}

			{!loading && !error && posts.length === 0 && (
				<p css={{ color: "#666" }}>No posts found.</p>
			)}

			{posts.length > 0 && (
				<ul
					css={{
						listStyle: "none",
						padding: 0,
						margin: 0,
					}}
				>
					{posts.map((post) => (
						<li
							key={post.id}
							css={{
								padding: "12px",
								marginBottom: "8px",
								backgroundColor: "white",
								borderRadius: "4px",
								boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
							}}
						>
							<h3
								css={{
									fontSize: "16px",
									marginBottom: "4px",
									color: "#333",
								}}
							>
								{post.title}
							</h3>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
