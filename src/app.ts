import fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import { userRoutes } from "./routes/user.routes.js";
import { householdRoutes } from "./routes/holsehold.routes.js";
import { expenseRoutes } from "./routes/expense.routes.js";
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
// Registrando o grupo de rotas de households
app.register(householdRoutes);

// Registrando o grupo de rotas de despesas (expenses)
app.register(expenseRoutes);

app.get("/health", async (_, reply) => {
    return reply.status(200).send({
        success: true,
        message: "Numa API está online e operante!",
    });
});
