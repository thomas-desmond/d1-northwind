import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
type Params = { productId: string };

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const startWorkflow = url.searchParams.get('start_workflow');
		if (!startWorkflow) return new Response('OK');

		const resp = await env.DB.prepare(`SELECT Id FROM Product`).run();
		const ids = resp.results.map((r) => r.Id) as string[];

		for (const id of ids) {
			const productId = id.toString();
			await env.PRODUCT_VECTOR_WORKFLOW.create({ params: { productId } });
		}
		return new Response('OK');
	},
} satisfies ExportedHandler<Env>;

export class GenerateProductVectorWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		const { productId } = event.payload;
		console.log(`Starting workflow for product ${productId}`);

		const product = await step.do(`Fetch product ${productId}`, async () => {
			const query = `SELECT * FROM Product WHERE Id = ?`;
			const resp = await this.env.DB.prepare(query).bind(productId).run();
			if (!resp.results.length) throw new Error(`Product ${productId} not found`);
			return resp.results[0] as { ProductName: string };
		});

		const existingVectors = await step.do(`Check for existing vector`, async () => {
			return await this.env.VECTORIZE.getByIds([productId]);
		});

		if (existingVectors.length) {
			console.log(`Product ${productId} already has a vector`);
			return;
		}

		const vector = await step.do(`Generate vector`, async () => {
			const text = product.ProductName;

			const modelResp = await this.env.AI.run('@cf/baai/bge-small-en-v1.5', { text });

			const vectors = modelResp.data[0];

			await this.env.VECTORIZE.upsert([
				{
					id: productId,
					values: vectors,
					metadata: { name: product.ProductName },
				},
			]);
		});

		console.log(`Vector for product ${productId} generated`);
	}
}
