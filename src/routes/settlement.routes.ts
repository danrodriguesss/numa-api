import type { FastifyInstance } from "fastify";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    settleMonthController,
    getSettlementsController,
    markAsPaidController,
    confirmPaymentController,
} from "../controllers/settlement.controller.js";

export const settlementRoutes = async (app: FastifyInstance) => {
    // Rota de sistema (CRON)
    app.post("/households/:id/settle", settleMonthController);

    // Rotas de usuários logados
    app.get(
        "/households/:id/settlements",
        { onRequest: [verifyJWT] },
        getSettlementsController,
    );

    // Rotas de dupla validação
    app.patch(
        "/settlements/:id/pay",
        { onRequest: [verifyJWT] },
        markAsPaidController,
    );
    app.patch(
        "/settlements/:id/confirm",
        { onRequest: [verifyJWT] },
        confirmPaymentController,
    );
};
