import type { FastifyReply, FastifyRequest } from "fastify";
import { registerUserSchema, loginSchema } from "../schemas/user.schema.js";
import {
    createUserService,
    authenticateUserService,
} from "../services/user.service.js";

export const registerUserController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        // Passa o corpo da requisição pelo validador do Zod
        const data = registerUserSchema.parse(req.body);

        // Chama o service passando os dados limpos
        const newUser = await createUserService(data);

        // Retorna o sucesso no padrão envelope
        return reply.status(201).send({
            success: true,
            data: newUser,
        });
    } catch (error: any) {
        // Tratamento de erro de validação no Zod
        if (error.name === "ZodError") {
            return reply.status(422).send({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Dados inválidos na requisição.",
                    details: error.errors,
                },
            });
        }

        // Tratamento de e-mail já cadastrado (Regra de Negócio)
        if (error.message === "EMAIL_ALREADY_EXISTS") {
            return reply.status(409).send({
                success: false,
                error: {
                    code: "EMAIL_ALREADY_EXISTS",
                    message: "Este e-mail já está cadastrado em outra conta.",
                },
            });
        }

        // Erro genérico do servidor
        return reply.status(500).send({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Ocorreu um erro inesperado no servidor.",
            },
        });
    }
};

export const loginController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const data = loginSchema.parse(req.body);

        // Autentica o usuário no banco
        const user = await authenticateUserService(data);

        // Gera o token JWT contendo o ID do usuário escondido (sub)
        const token = await reply.jwtSign(
            {
                sub: user.id,
                name: user.name,
            },
            {
                expiresIn: "7d",
            },
        );

        return reply.status(200).send({
            success: true,
            data: {
                user,
                token,
            },
        });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return reply.status(422).send({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Dados inválidos na requisição.",
                    details: error.errors,
                },
            });
        }

        if (error.message === "INVALID_CREDENTIALS") {
            return reply.status(401).send({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "E-mail ou senha incorretos.",
                },
            });
        }

        return reply.status(500).send({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Ocorreu um erro inesperado no servidor.",
            },
        });
    }
};
