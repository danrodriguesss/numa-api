import type { FastifyRequest, FastifyReply } from "fastify";
import { createExpenseSchema } from "../schemas/expense.schema.js";
import { createExpenseService } from "../services/expense.service.js";

export const createExpenseController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const data = createExpenseSchema.parse(req.body);
        const userId = req.user.sub;

        const expense = await createExpenseService(userId, data);

        return reply.status(201).send({
            success: true,
            message: "Despesa e itens registrados com sucesso!",
            data: expense,
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

        if (error.message === "HOUSEHOLD_NOT_FOUND") {
            return reply.status(404).send({
                success: false,
                error: {
                    code: "HOUSEHOLD_NOT_FOUND",
                    message: "Casa não encontrada.",
                },
            });
        }

        if (error.message === "FORBIDDEN") {
            return reply.status(403).send({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message:
                        "Você não tem permissão para registrar despesas nesta casa.",
                },
            });
        }

        if (error.message === "EXPENSE_ALREADY_EXISTS") {
            return reply.status(409).send({
                success: false,
                error: {
                    code: "EXPENSE_ALREADY_EXISTS",
                    message:
                        "Uma despesa com esse ID já foi cadastrada anteriormente.",
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
