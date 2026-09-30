import { z } from "zod";

export const settleMonthParamsSchema = z.object({
    id: z.uuid("ID da casa inválido."),
});

export const settleMonthBodySchema = z.object({
    month: z
        .string()
        .regex(
            /^\d{4}-\d{2}$/,
            "O mês deve estar no formato YYYY-MM (ex: 2026-09)",
        ),
});

export const getSettlementsQuerySchema = z.object({
    month: z
        .string()
        .regex(
            /^\d{4}-\d{2}$/,
            "O mês deve estar no formato YYYY-MM (ex: 2026-09)",
        )
        .optional()
        .or(z.literal("")),
});
