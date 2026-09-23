import type { FastifyRequest, FastifyReply } from "fastify";
import { createHouseholdSchema } from "../schemas/household.schema.js";
import {
    createHouseholdService,
    listUserHouseholdsService,
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
