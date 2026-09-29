import type { FastifyInstance } from "fastify";
import { settleMonthController } from "../controllers/settlement.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

export const settlementRoutes = async (app: FastifyInstance) => {
    app.post(
        "/households/:id/settle",
        { onRequest: [verifyJWT] },
        settleMonthController,
    );
};
