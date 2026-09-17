import fastify from "fastify";
import { userRoutes } from "./routes/user.routes.js";

export const app = fastify({
    logger: true,
});

// Registrando o grupo de rotas de usuários
app.register(userRoutes);

app.get("/health", async (_, reply) => {
    return reply.status(200).send({
        success: true,
        message: "Numa API está online e operante!",
    });
});
