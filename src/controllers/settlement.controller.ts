import type { FastifyRequest, FastifyReply } from "fastify";
import {
    settleMonthParamsSchema,
    settleMonthBodySchema,
} from "../schemas/settlement.schema.js";
import { calculateSettlementsService } from "../services/settlement.service.js";

export const settleMonthController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const { id } = settleMonthParamsSchema.parse(req.params);
        const { month } = settleMonthBodySchema.parse(req.body);
        const authUserId = req.user.sub;

        const result = await calculateSettlementsService(id, authUserId, month);

        return reply.status(200).send({
            success: true,
            message: "Mês fechado e acertos calculados com sucesso!",
            data: result,
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

        if (error.message === "FORBIDDEN") {
            return reply.status(403).send({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: "Você não tem permissão nesta casa.",
                },
            });
        }

        if (error.message === "MONTH_ALREADY_SETTLED") {
            return reply.status(400).send({
                success: false,
                error: {
                    code: "MONTH_ALREADY_SETTLED",
                    message:
                        "Este mês já foi fechado e as dívidas já foram geradas.",
                },
            });
        }

        if (error.message === "NO_EXPENSES") {
            return reply.status(400).send({
                success: false,
                error: {
                    code: "NO_EXPENSES",
                    message: "Não há despesas registradas para este mês.",
                },
            });
        }

        if (error.message === "NO_MEMBERS") {
            return reply.status(400).send({
                success: false,
                error: {
                    code: "NO_MEMBERS",
                    message: "Não há membros registrados para esta casa.",
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
