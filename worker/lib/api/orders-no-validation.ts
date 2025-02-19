import { createSQLLog, prepareStatements } from "../tools";

const apiOrdersNoValidation = () => {
  return {
    path: "orders-no-validation",
    method: "GET",
    handler: async (request: Request, env: Env) => {
      const role = request.headers.get("Role") || "admin";
      const { searchParams } = new URL(request.url);
      const count = searchParams.get("count");
      const page = parseInt(searchParams.get("page") as string) || 1;
      const itemsPerPage = 20;

      let customerFilter = "";
      let countStatement = "'Order'"
      if (role === "user") {
        customerFilter = ` AND "Order".CustomerId = 'AROUT'`;
        countStatement += ` WHERE "Order".CustomerId = 'AROUT'`
      }


      const sqlQuery = `
        SELECT SUM(OrderDetail.UnitPrice * OrderDetail.Discount * OrderDetail.Quantity) AS TotalProductsDiscount,
               SUM(OrderDetail.UnitPrice * OrderDetail.Quantity) AS TotalProductsPrice,
               SUM(OrderDetail.Quantity) AS TotalProductsItems,
               COUNT(OrderDetail.OrderId) AS TotalProducts,
               "Order".Id,
               CustomerId,
               EmployeeId,
               OrderDate,
               RequiredDate,
               ShippedDate,
               ShipVia,
               Freight,
               ShipName,
               ShipAddress,
               ShipCity,
               ShipRegion,
               ShipPostalCode,
               ShipCountry,
               ProductId
        FROM "Order", OrderDetail
        WHERE OrderDetail.OrderId = "Order".Id ${customerFilter}
        GROUP BY "Order".Id
        LIMIT ? OFFSET ?
      `;

      const params = [itemsPerPage, (page - 1) * itemsPerPage];

      const [stmts, sql] = prepareStatements(
        env.DB,
        count ? countStatement : false,
        [sqlQuery],
        [params]
      );

      try {
        const startTime = Date.now();
        const response: D1Result<any>[] = await env.DB.batch(
          stmts as D1PreparedStatement[]
        );
        const overallTimeMs = Date.now() - startTime;

        const first = response[0];
        const total =
          count && first.results ? (first.results[0] as any).total : 0;
        const orders: any = count
          ? response.slice(1)[0].results
          : response[0].results;

        return {
          page: page,
          pages: count ? Math.ceil(total / itemsPerPage) : 0,
          items: itemsPerPage,
          total: count ? total : 0,
          stats: {
            queries: stmts.length,
            results: orders.length + (count ? 1 : 0),
            select: stmts.length,
            overallTimeMs: overallTimeMs,
            log: createSQLLog(sql, response, overallTimeMs),
          },
          orders: orders,
        };
      } catch (e: any) {
        return { error: 404, msg: e.toString() };
      }
    },
  };
};

interface Env {
  DB: D1Database;
}

export { apiOrdersNoValidation };
