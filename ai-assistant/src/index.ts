
const sampleData = [
	{
		textMatch: 'Rattlesnake Canyon Grocer',
		metadata: {
			companyName: 'Rattlesnake Canyon Grocer',
			creditCard: '1234-1234-1234-1234',
		},
	},
	{
		textMatch: 'Best Customer',
		metadata: {
			companyName: 'Rattlesnake Canyon Grocer',
			yearlySpend: '5,000,000',
		},
	},
];

async function getInventoryCount(env: Env, productName: string) {
	try {
		// Query the database for the product inventory
		const result = await env.DB.prepare(
			'SELECT ProductName, UnitsInStock FROM Product WHERE ProductName = ?'
		).bind(productName).first();

		if (result) {
			return {
				productName: result.ProductName,
				quantity: result.UnitsInStock || 0,
			};
		} else {
			// Product not found, return 0 quantity
			return {
				productName,
				quantity: 0,
			};
		}
	} catch (error) {
		console.error('Database query error:', error);
		// Fallback to 0 if database query fails
		return {
			productName,
			quantity: 0,
		};
	}
}

// CORS headers helper function
function corsHeaders() {
	return {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Max-Age': '86400',
	};
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// Handle preflight OPTIONS requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: corsHeaders(),
			});
		}

		let path = new URL(request.url).pathname;
		if (path.startsWith('/favicon')) {
			return new Response('', { status: 404 });
		}

		// You only need to insert vectors into your index once
		if (path.startsWith('/insert')) {
			const vectorsToInsert = [];

			// Loop through all sample data entries
			for (const data of sampleData) {
				const embeddings = await env.AI.run(
					'@cf/baai/bge-base-en-v1.5',
					{
						text: data.textMatch,
					},
					{
						gateway: {
							id: 'northwind-ai-gateway',
							skipCache: false,
						},
					}
				);
				const values = embeddings.data[0];

				// Add vector with metadata to the batch
				// Filter out undefined values from metadata
				const cleanMetadata: Record<string, string> = {};
				for (const [key, value] of Object.entries(data.metadata)) {
					if (value !== undefined) {
						cleanMetadata[key] = value;
					}
				}
				
				vectorsToInsert.push({
					id: data.textMatch, // Use textMatch as the index/ID
					values: values, // The embedding vector
					metadata: cleanMetadata, // Your metadata object
				});
			}

			const inserted = await env.VECTORIZE.insert(vectorsToInsert);

			// Return the mutation identifier for this insert operation
			return new Response(JSON.stringify(inserted), {
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders(),
				},
			});
		}

		// Query vectors with metadata retrieval
		if (path.startsWith('/ai/customer')) {
			// Get query text from request body
			const body = (await request.json()) as { prompt?: string };
			const queryText = body.prompt;

			if (!queryText) {
				return new Response(JSON.stringify({ error: "Missing 'prompt' field in request body" }), {
					status: 400,
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders(),
					},
				});
			}

			const embeddings = await env.AI.run(
				'@cf/baai/bge-base-en-v1.5',
				{
					text: queryText,
				},
				{
					gateway: {
						id: 'northwind-ai-gateway',
						skipCache: false,
					},
				}
			);
			const queryVector = embeddings.data[0];

			// Query the vectorize index - metadata is automatically returned
			const results = await env.VECTORIZE.query(queryVector, {
				topK: 1,
				returnMetadata: true, // This ensures metadata is included in results
			});

			return new Response(JSON.stringify(results), {
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders(),
				},
			});
		}

		if (path.startsWith('/ai/inventory')) {
			// Get query text from request body
			const body = (await request.json()) as { messages?: { role: string; content: string; name?: string }[] };
			const messages = body.messages;

			if (!messages) {
				return new Response(JSON.stringify({ error: "Missing 'messages' field in request body" }), {
					status: 400,
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders(),
					},
				});
			}

			messages.unshift({
				role: 'system',
				content: `You are a back office e-commerce assistant meant to get inventory counts`,
			});

			const tools = [
				{
					name: 'getInventory',
					description: 'Gets the inventory amount for a product',
					parameters: {
						type: 'object',
						properties: {
							productName: {
								type: 'string',
								description: 'The name of the product to check inventory for',
							},
						},
						required: ['productName'],
					},
				},
			];

			let result: AiTextGenerationOutput = await env.AI.run('@hf/nousresearch/hermes-2-pro-mistral-7b', {
				messages,
				tools,
			}, {
				gateway: {
					id: 'northwind-ai-gateway',
					skipCache: false,
				},
			});

			while (result.tool_calls !== undefined) {
				for (const tool_call of result.tool_calls) {
					switch (tool_call.name) {
						case 'getInventory':
							const args = tool_call.arguments as { productName: string };
							const fnResponse = await getInventoryCount(env, args.productName);
							messages.push({ role: 'tool', name: tool_call.name, content: JSON.stringify(fnResponse) });
							console.log({ messages, messagesJSON: JSON.stringify(messages) });
							result = await env.AI.run('@hf/nousresearch/hermes-2-pro-mistral-7b', {
								messages,
								tools,
							}, {
								gateway: {
									id: 'northwind-ai-gateway',
									skipCache: false,
								},
							});
							console.log({ result });
							if (result.response !== null && result.response !== undefined) {
								messages.push({ role: 'assistant', content: result.response });
							}
							break;
						default:
							messages.push({ role: 'tool', name: tool_call.name, content: `ERROR: Tool not found "${tool_call.name}"` });
							break;
					}
				}
			}
			const finalMessage = messages[messages.length - 1];
			console.log({ finalMessage });
			if (finalMessage.role !== 'assistant') {
				messages.push({ role: 'assistant', content: result.response as string });
			}
			// Remove the system message
			messages.splice(0, 1);
			return new Response(JSON.stringify({ messages }), {
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders(),
				},
			});
		}

		return new Response(JSON.stringify({ text: 'nothing to do... yet' }), {
			status: 404,
			headers: {
				'Content-Type': 'application/json',
				...corsHeaders(),
			},
		});
	},
} satisfies ExportedHandler<Env>;
