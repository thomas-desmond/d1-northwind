import { createSQLLog, prepareStatements } from "../tools";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

const apiEmployees = () => {
  return {
    path: "employees",
    method: "GET",
    handler: async (request: Request, env: Env) => {
      const { searchParams } = new URL(request.url);
      const count = searchParams.get("count");
      const page = parseInt(searchParams.get("page") as string) || 1;
      const itemsPerPage = 2;
      const adapter = new PrismaD1(env.DB);
      const prisma = new PrismaClient({ adapter });

      try {
        let employees;
        const startTime = Date.now();
        employees = await prisma.employee.findMany({ take: itemsPerPage });
        if (page !== 1) {
          employees = await prisma.employee.findMany({
            skip: itemsPerPage * (page - 1),
            take: itemsPerPage,
          });
        }
        const overallTimeMs = Date.now() - startTime;

        const total = count ? await prisma.employee.count() : 0;
        return {
          page: page,
          pages: count ? Math.ceil(total / itemsPerPage) : 0,
          items: itemsPerPage,
          total: count ? total : 0,
          stats: {
            results: employees.length + (count ? 1 : 0),
            overallTimeMs: overallTimeMs,
          },
          employees: employees,
        };
      } catch (e: any) {
        return { error: 404, msg: e.toString() };
      }
    },
  };
};

const apiEmployee = () => {
  return {
    path: "employee",
    method: "GET",
    handler: async (request: Request, env: Env) => {
      const { searchParams } = new URL(request.url);
      const id = parseInt(searchParams.get("Id") || "0");
      const adapter = new PrismaD1(env.DB);
      const prisma = new PrismaClient({ adapter });
      try {
        const startTime = Date.now();
        const employee = await prisma.employee.findUnique({
          where: {
            id: id,
          },
        });
        const overallTimeMs = Date.now() - startTime;

        return {
          stats: {
            queries: 1,
            results: 1,
            select_leftjoin: 1,
            overallTimeMs: overallTimeMs,
          },
          employee: employee,
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

export { apiEmployees, apiEmployee };
