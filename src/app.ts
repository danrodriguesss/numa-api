import fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import { userRoutes } from "./routes/user.routes.js";
import "dotenv/config";

export const app = fastify({
    logger: true,
});

// Registrando o JWT
app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET as string,
});

// Registrando o grupo de rotas de usuários
app.register(userRoutes);

app.get("/health", async (_, reply) => {
    return reply.status(200).send({
        success: true,
        message: "Numa API está online e operante!",
    });
});
