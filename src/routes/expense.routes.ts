import type { FastifyInstance } from "fastify";
import {
    createExpenseController,
    getExpensesController,
    updateExpenseController,
    deleteExpenseController,
} from "../controllers/expense.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

export const expenseRoutes = async (app: FastifyInstance) => {
    app.post("/expenses", { onRequest: [verifyJWT] }, createExpenseController);
    app.get("/expenses", { onRequest: [verifyJWT] }, getExpensesController);
    app.put(
        "/expenses/:id",
        { onRequest: [verifyJWT] },
        updateExpenseController,
    );
    app.delete(
        "/expenses/:id",
        { onRequest: [verifyJWT] },
        deleteExpenseController,
    );
};
