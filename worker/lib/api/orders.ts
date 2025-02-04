import { createSQLLog, prepareStatements } from "../tools";
import jwt from "jsonwebtoken";

const apiOrders = () => {
  return {
    path: "orders",
    method: "GET",
    handler: async (request: Request, env: Env) => {
      const { searchParams } = new URL(request.url);
      const token = request.headers.get("token");
      const count = searchParams.get("count");
      const page = parseInt(searchParams.get("page") as string) || 1;
      const itemsPerPage = 20;

      if (!token) {
        return { error: 401, msg: "Unauthorized" };
      }

      let decodedToken;
      try {
        decodedToken = jwt.decode(token);
        if (!decodedToken) {
          throw new Error("Invalid token");
        }
      } catch (e) {
        return { error: 400, msg: "Invalid token" };
      }

      const { role, customerId } = decodedToken as {
        role: string;
        customerId: string;
      };
      let customerFilter = "";
      let countStatement = "'Order'"
      if (role === "user") {
        customerFilter = ` AND "Order".CustomerId = '${customerId}'`;
        countStatement += ` WHERE "Order".CustomerId = '${customerId}'`
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

const apiOrder = () => {
  return {
    path: "order",
    method: "GET",
    handler: async (request: Request, env: Env) => {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("Id");
      const [stmts, sql] = prepareStatements(
        env.DB,
        false,
        [
          'SELECT Shipper.CompanyName AS ShipViaCompanyName, SUM(OrderDetail.UnitPrice * OrderDetail.Discount * OrderDetail.Quantity) AS TotalProductsDiscount, SUM(OrderDetail.UnitPrice * OrderDetail.Quantity) AS TotalProductsPrice, SUM(OrderDetail.Quantity) AS TotalProductsItems, COUNT(OrderDetail.OrderId) AS TotalProducts, "Order".Id, CustomerId, EmployeeId, OrderDate, RequiredDate, ShippedDate, ShipVia, Freight, ShipName, ShipAddress, ShipCity, ShipRegion, ShipPostalCode, ShipCountry, ProductId FROM "Order", OrderDetail, Shipper WHERE OrderDetail.OrderId = "Order".Id AND "Order".Id = ?1 AND "Order".ShipVia = Shipper.Id GROUP BY "Order".Id',
          "SELECT OrderDetail.OrderId, OrderDetail.Quantity, OrderDetail.UnitPrice AS OrderUnitPrice, OrderDetail.Discount, Product.Id, ProductName, SupplierId, CategoryId, QuantityPerUnit, Product.UnitPrice AS ProductUnitPrice, UnitsInStock, UnitsOnOrder, ReorderLevel, Discontinued FROM Product, OrderDetail WHERE OrderDetail.OrderId = ?1 AND OrderDetail.ProductId = Product.Id",
        ],
        [[id], [id]]
      );

      try {
        const startTime = Date.now();
        const response = await env.DB.batch(stmts as D1PreparedStatement[]);
        const overallTimeMs = Date.now() - startTime;

        const orders: any = response[0].results;
        const products: any = response[1].results;
        return {
          stats: {
            queries: stmts.length,
            results: products.length + 1,
            select: stmts.length,
            select_where: stmts.length,
            overallTimeMs: overallTimeMs,
            log: createSQLLog(sql, response, overallTimeMs),
          },
          order: orders ? orders[0] : {},
          products: products,
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

export { apiOrders, apiOrder };
