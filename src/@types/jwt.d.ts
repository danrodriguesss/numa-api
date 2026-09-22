import "@fastify/jwt";

declare module "@fastify/jwt" {
    interface FastifyJWT {
        user: {
            sub: string; // ID do usuário (padrão do mercado chamar de sub - subject)
            name: string;
        };
    }
}
