import type { FastifyInstance } from "fastify";
import {
    registerUserController,
    loginController,
    getMeController,
    updatePixController,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

export const userRoutes = async (app: FastifyInstance) => {
    app.post("/auth/register", registerUserController);
    app.post("/auth/login", loginController);

    // ROTAS PROTEGIDAS: permitidas apenas com token válido!
    app.get("/users/me", { onRequest: [verifyJWT] }, getMeController);
    app.patch("/users/me/pix", { onRequest: [verifyJWT] }, updatePixController);
};
