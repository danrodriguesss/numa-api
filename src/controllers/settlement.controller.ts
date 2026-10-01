import type { FastifyRequest, FastifyReply } from "fastify";
import {
    settleMonthParamsSchema,
    settleMonthBodySchema,
    getSettlementsQuerySchema,
    settlementIdParamSchema,
} from "../schemas/settlement.schema.js";
import {
    calculateSettlementsService,
    getSettlementsService,
    markAsPaidService,
    confirmPaymentService,
} from "../services/settlement.service.js";

export const settleMonthController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        // Validação de segurança do sistema (CRON)
        const authHeader = req.headers.authorization;
        const cronSecret = process.env.CRON_SECRET;

        // A vercel envia o segredo no formato "Bearer <SECRET>"
        if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
            return reply.status(401).send({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Chamada de sistema não autorizada.",
                },
            });
        }

        const { id } = settleMonthParamsSchema.parse(req.params);
        const { month } = settleMonthBodySchema.parse(req.body);

        const result = await calculateSettlementsService(id, month);

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

        if (error.message === "HOUSEHOLD_NOT_FOUND") {
            return reply.status(404).send({
                success: false,
                error: {
                    code: "HOUSEHOLD_NOT_FOUND",
                    message: "Casa não encontrada.",
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

export const getSettlementsController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const { id } = settleMonthParamsSchema.parse(req.params);
        const { month } = getSettlementsQuerySchema.parse(req.query);
        const authUserId = req.user.sub;

        const results = await getSettlementsService(id, authUserId, month);

        return reply.status(200).send({
            success: true,
            data: results,
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
                        "Você não tem permissão para ver os acertos desta casa.",
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

export const markAsPaidController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const { id } = settlementIdParamSchema.parse(req.params);
        const authUserId = req.user.sub;

        const result = await markAsPaidService(id, authUserId);

        return reply.status(200).send({
            success: true,
            message:
                "Pagamento sinalizado com sucesso. Aguardando confirmação do credor!",
            data: result,
        });
    } catch (error: any) {
        return handleSettlementError(error, reply);
    }
};

export const confirmPaymentController = async (
    req: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const { id } = settlementIdParamSchema.parse(req.params);
        const authUserId = req.user.sub;

        const result = await confirmPaymentService(id, authUserId);

        return reply.status(200).send({
            success: true,
            message: "Pagamento recebido e dívida liquidada!",
            data: result,
        });
    } catch (error: any) {
        return handleSettlementError(error, reply);
    }
};

// Função auxiliar para não repetir os mesmos IFs nos dois controllers
const handleSettlementError = (error: any, reply: FastifyReply) => {
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

    if (error.message === "SETTLEMENT_NOT_FOUND") {
        return reply.status(404).send({
            success: false,
            error: {
                code: "SETTLEMENT_NOT_FOUND",
                message: "Acerto de conta não encontrado.",
            },
        });
    }

    if (error.message === "FORBIDDEN_PAYER") {
        return reply.status(403).send({
            success: false,
            error: {
                code: "FORBIDDEN",
                message: "Apenas o devedor pode sinalizar o pagamento.",
            },
        });
    }

    if (error.message === "FORBIDDEN_RECEIVER") {
        return reply.status(403).send({
            success: false,
            error: {
                code: "FORBIDDEN",
                message: "Apenas o credor pode confirmar o recebimento.",
            },
        });
    }

    if (error.message === "INVALID_STATUS_TRANSITION") {
        return reply.status(400).send({
            success: false,
            error: {
                code: "INVALID_STATUS",
                message: "Ação não permitida para o status atual desta dívida.",
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
};
