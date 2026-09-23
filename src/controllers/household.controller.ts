import type { FastifyRequest, FastifyReply } from "fastify";
import {
    createHouseholdSchema,
    joinHouseholdSchema,
} from "../schemas/household.schema.js";
import {
    createHouseholdService,
    listUserHouseholdsService,
    joinHouseholdService,
} from "../services/household.service.js";

export const createHouseholdController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const data = createHouseholdSchema.parse(req.body);

        // Obtém o ID do usuário que está logado fazendo a requisição
        const userId = req.user.sub;

        const newHousehold = await createHouseholdService(data, userId);

        return reply.status(201).send({
            success: true,
            data: newHousehold,
        });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return reply.status(422).send({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Dados inválidos na requisição.",
                    details: error.issues,
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

export const listUserHouseholdsController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const userId = req.user.sub;

        const householdsList = await listUserHouseholdsService(userId);

        return reply.status(200).send({
            success: true,
            data: householdsList,
        });
    } catch (error: any) {
        return reply.status(500).send({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Ocorreu um erro inesperado no servidor.",
            },
        });
    }
};

export const joinHouseholdController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const { inviteCode } = joinHouseholdSchema.parse(req.body);
        const userId = req.user.sub;

        const household = await joinHouseholdService(userId, inviteCode);

        return reply.status(200).send({
            success: true,
            message: "Você entrou na casa com sucesso!",
            data: household,
        });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return reply.status(422).send({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Dados inválidos na requisição.",
                    details: error.issues,
                },
            });
        }

        if (error.message === "INVALID_INVITE_CODE") {
            return reply.status(404).send({
                success: false,
                error: {
                    code: "INVALID_INVITE_CODE",
                    message: "Código de convite inválido ou não encontrado.",
                },
            });
        }

        if (error.message === "ALREADY_A_MEMBER") {
            return reply.status(409).send({
                success: false,
                error: {
                    code: "ALREADY_A_MEMBER",
                    message: "Você já faz parte dessa casa.",
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
