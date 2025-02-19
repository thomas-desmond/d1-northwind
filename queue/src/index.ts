/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8789/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.json`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	northwind_inventory_queue: Queue<any>;
	DB: D1Database;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const corsHeaders = getCorsHeaders();
		if (handleOptionsRequest(request, corsHeaders)) {
			return new Response('OK', {
				headers: corsHeaders,
			});
		}

		const body = (await request.json()) as { updateInventoryBy: number; productId: number };
		let productUpdate = {
			updateInventoryBy: body.updateInventoryBy,
			productId: body.productId,
		};

		await env.northwind_inventory_queue.send(productUpdate);
		return Response.json('Success', { headers: { ...corsHeaders } });
	},

	async queue(batch, env): Promise<void> {
		// Simulate an error during the batch update process for 15% of the calls
		if (Math.random() < 0.15) {
			throw new Error('Simulated error during batch update for testing queue retry logic');
		}

		const updates = batch.messages.reduce((acc, message) => {
			const body = message.body as { updateInventoryBy: number; productId: number };
			const { updateInventoryBy, productId } = body;
			const retryCount = message.attempts;
			console.log(`Processing product ID: ${productId}, update inventory by ${updateInventoryBy}. Attempt count: ${retryCount}`);
			if (!acc[productId]) {
				acc[productId] = 0;
			}
			acc[productId] += updateInventoryBy;
			return acc;
		}, {} as Record<number, number>);

		console.log(`Batch size: ${batch.messages.length}, Updates size: ${Object.keys(updates).length}`);

		// Create statements for aggregated updates
		const statements = Object.entries(updates).map(([productId, totalUpdate]) => {
			return env.DB.prepare(`UPDATE Product SET UnitsInStock = UnitsInStock + ? WHERE Id = ?`).bind(totalUpdate, productId);
		});

		await env.DB.batch(statements);
	},
} satisfies ExportedHandler<Env>;

function getCorsHeaders() {
	return {
		'Access-Control-Allow-Headers': '*',
		'Access-Control-Allow-Methods': 'POST',
		'Access-Control-Allow-Origin': '*',
	};
}

function handleOptionsRequest(request: Request, corsHeaders: HeadersInit): boolean {
	if (request.method === 'OPTIONS') {
		return true;
	}
	return false;
}
