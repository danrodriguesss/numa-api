import type { FastifyInstance } from "fastify";
import {
    registerUserController,
    loginController,
} from "../controllers/user.controller.js";

export const userRoutes = async (app: FastifyInstance) => {
    app.post("/auth/register", registerUserController);
    app.post("/auth/login", loginController);
};
