import { createSQLLog, prepareStatements } from "../tools";

const apiRecommendationsForProduct = () => {
  return {
    path: "product_recommendation",
    method: "GET",
    handler: async (request: Request, env: Env) => {
      const { searchParams } = new URL(request.url);

      try {
        const startTime = Date.now();

        const idParam = searchParams.get("Id");
        const result = await env.VECTORIZE.queryById(idParam, {
          topK: 9,
          returnMetadata: "all",
        });
        const matches = result.matches.filter((match) => match.id !== idParam);
        const products = matches.map((m) => ({
          id: m.id,
          name: m.metadata.name,
          score: m.score,
        }));

        const overallTimeMs = Date.now() - startTime;

        return {
          stats: {
            queries: 1,
            results: products.length,
            select: 1,
            overallTimeMs: overallTimeMs,
            // log: createSQLLog(sql, [products], overallTimeMs),
          },
          products,
        };
      } catch (e: any) {
        return { error: 404, msg: e.toString() };
      }
    },
  };
};

export { apiRecommendationsForProduct };
