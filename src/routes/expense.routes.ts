import type { FastifyInstance } from "fastify";
import {
    createExpenseController,
    getExpensesController,
} from "../controllers/expense.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

export const expenseRoutes = async (app: FastifyInstance) => {
    app.post("/expenses", { onRequest: [verifyJWT] }, createExpenseController);
    app.get("/expenses", { onRequest: [verifyJWT] }, getExpensesController);
};
