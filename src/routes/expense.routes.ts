import type { FastifyInstance } from "fastify";
import { createExpenseController } from "../controllers/expense.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

export const expenseRoutes = async (app: FastifyInstance) => {
    app.post("/expenses", { onRequest: [verifyJWT] }, createExpenseController);
};
