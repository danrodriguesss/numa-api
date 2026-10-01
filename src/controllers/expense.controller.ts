import type { FastifyRequest, FastifyReply } from "fastify";
import {
    createExpenseSchema,
    expenseIdParamSchema,
    getExpensesQuerySchema,
    updateExpenseSchema,
} from "../schemas/expense.schema.js";
import {
    createExpenseService,
    getExpensesService,
    updateExpenseService,
    deleteExpenseService,
} from "../services/expense.service.js";

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

export const getExpensesController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const filters = getExpensesQuerySchema.parse(req.query);
        const authUserId = req.user.sub;

        const expensesList = await getExpensesService(authUserId, filters);

        return reply.status(200).send({
            success: true,
            data: expensesList,
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
                    message:
                        "Você não tem permissão para visualizar as despesas dessa casa.",
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

export const updateExpenseController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const { id } = expenseIdParamSchema.parse(req.params);
        const data = updateExpenseSchema.parse(req.body);
        const authUserId = req.user.sub;

        const updatedExpense = await updateExpenseService(id, authUserId, data);

        return reply.status(200).send({
            success: true,
            message: "Despesa atualizada com sucesso!",
            data: updatedExpense,
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

        if (error.message === "EXPENSE_NOT_FOUND") {
            return reply.status(404).send({
                success: false,
                error: {
                    code: "EXPENSE_NOT_FOUND",
                    message: "Despesa não encontrada.",
                },
            });
        }

        if (error.message === "MONTH_ALREADY_SETTLED") {
            return reply.status(400).send({
                success: false,
                error: {
                    code: "MONTH_ALREADY_SETTLED",
                    message:
                        "Não é possível alterar despesas de um mês que já teve a conta fechada.",
                },
            });
        }

        if (error.message === "FORBIDDEN") {
            return reply.status(403).send({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message:
                        "Você não tem permissão para alterar esta despesa.",
                },
            });
        }

        if (error.message === "UNAUTHORIZED_ACTION") {
            return reply.status(401).send({
                success: false,
                error: {
                    code: "UNAUTHORIZED_ACTION",
                    message:
                        "Apenas o criador da despesa ou um administrador da casa podem realizar essa ação.",
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

export const deleteExpenseController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        // Reaproveitando o schema criado para a rota PUT
        const { id } = expenseIdParamSchema.parse(req.params);
        const authUserId = req.user.sub;

        await deleteExpenseService(id, authUserId);

        return reply.status(200).send({
            success: true,
            message: "Despesa removida com sucesso!",
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

        if (error.message === "EXPENSE_NOT_FOUND") {
            return reply.status(404).send({
                success: false,
                error: {
                    code: "EXPENSE_NOT_FOUND",
                    message: "Despesa não encontrada.",
                },
            });
        }

        if (error.message === "MONTH_ALREADY_SETTLED") {
            return reply.status(400).send({
                success: false,
                error: {
                    code: "MONTH_ALREADY_SETTLED",
                    message:
                        "Não é possível apagar despesas de um mês que já teve a conta fechada.",
                },
            });
        }

        if (error.message === "FORBIDDEN") {
            return reply.status(403).send({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message:
                        "Você não tem permissão para remover esta despesa.",
                },
            });
        }

        if (error.message === "UNAUTHORIZED_ACTION") {
            return reply.status(401).send({
                success: false,
                error: {
                    code: "UNAUTHORIZED_ACTION",
                    message:
                        "Apenas o criador da despesa ou um administrador podem realizar essa ação.",
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
