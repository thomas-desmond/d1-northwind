import { createSQLLog, prepareStatements } from "../tools";

const apiRecommendationsForProduct = () => {
  return {
    path: "product_recommendation",
    method: "GET",
    handler: async (request: Request, env: Env) => {
      const { searchParams } = new URL(request.url);

      try {
        const idParam = searchParams.get("Id");
        const result = await env.VECTORIZE.queryById(idParam, { topK: 9 });
        const matches = result.matches.filter((match) => match.id !== idParam);
        const ids = matches.map((m) => m.id);

        const placeholders = ids.map((_, index) => `?${index + 1}`).join(',');

        const [stmts, sql] = prepareStatements(
          env.DB,
          false,
          [
            `SELECT Product.Id, ProductName, SupplierId, CategoryId, QuantityPerUnit, 
             UnitPrice, UnitsInStock, UnitsOnOrder, ReorderLevel, Discontinued, 
             Supplier.CompanyName AS SupplierName 
             FROM Product, Supplier 
             WHERE Product.Id IN (${placeholders}) 
             AND Supplier.Id = Product.SupplierId`
          ],
          [ids]
        );

        const startTime = Date.now();
        const products: D1Result<any> = await (
          stmts[0] as D1PreparedStatement
        ).all();
        const overallTimeMs = Date.now() - startTime;

        return {
          stats: {
            queries: 1,
            results: products.results?.length || 0,
            select: 1,
            overallTimeMs: overallTimeMs,
            log: createSQLLog(sql, [products], overallTimeMs),
          },
          products: products.results || [],
          similarityScores: matches.map(m => ({
            id: m.id,
            score: m.score
          }))
        };
      } catch (e: any) {
        return { error: 404, msg: e.toString() };
      };
    },
  };
};

interface Env {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
}

export { apiRecommendationsForProduct };
