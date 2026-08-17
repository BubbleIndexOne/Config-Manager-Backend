export interface Env {
	DB: D1Database;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/api/health") {
			return new Response(JSON.stringify({ status: "ok" }), {
				headers: { "content-type": "application/json" }
			});
		}

		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
