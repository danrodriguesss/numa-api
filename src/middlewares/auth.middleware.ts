import type { FastifyRequest, FastifyReply } from "fastify";

export const verifyJWT = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        // Tenta decodificar o token que vem no cabeçalho (Header: Authorization)
        await req.jwtVerify();
    } catch (error) {
        // Se não houver token, ou for inválido/expirado, barra aqui mesmo.
        return reply.status(401).send({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Token de acesso inválido, ausente ou expirado.",
            },
        });
    }
};
