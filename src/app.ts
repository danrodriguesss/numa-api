import fastify from "fastify";

export const app = fastify({
    logger: true,
});

app.get("/health", async (_, reply) => {
    return reply.status(200).send({
        success: true,
        message: "Numa API está online e operante!",
    });
});
