import type { FastifyInstance } from "fastify";
import {
    createHouseholdController,
    listUserHouseholdsController,
} from "../controllers/household.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

export const householdRoutes = (app: FastifyInstance) => {
    // O usuário OBRIGATORIAMENTE precisa estar logado para criar uma casa
    app.post(
        "/households",
        { onRequest: [verifyJWT] },
        createHouseholdController,
    );

    app.get(
        "/households",
        { onRequest: [verifyJWT] },
        listUserHouseholdsController,
    );
};
