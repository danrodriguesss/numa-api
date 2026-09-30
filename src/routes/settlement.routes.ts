import type { FastifyInstance } from "fastify";
import { settleMonthController } from "../controllers/settlement.controller.js";

export const settlementRoutes = async (app: FastifyInstance) => {
    app.post("/households/:id/settle", settleMonthController);
};
