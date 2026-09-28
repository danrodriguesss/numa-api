import { z } from "zod";

export const expenseItemSchema = z.object({
    id: z.uuid("ID do item inválido."),
    name: z.string().min(3, "Nome do item é obrigatório."),
    unit_price: z.number().positive("Preço unitário deve ser maior que zero."),
    quantity: z.number().int().positive("Quantidade deve ser pelo menos 1."),
});

export const createExpenseSchema = z.object({
    id: z.uuid("ID da despesa inválido."),
    household_id: z.uuid("ID da casa inválido."),
    paid_by: z.uuid("ID do pagador inválido."),
    title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
    category: z.string().default("Variável"),
    expense_date: z.string().min(1, "A data da despesa é obrigatória."),
    items: z
        .array(expenseItemSchema)
        .min(1, "A despesa precisa ter pelo menos 1 item."),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const getExpensesQuerySchema = z.object({
    householdId: z.uuid("O ID da casa é obrigatório e deve ser um UUID."),
    userId: z
        .uuid("ID do usuário deve ser um UUID.")
        .optional()
        .or(z.literal("")),
    month: z
        .string()
        .regex(
            /^\d{4}-\d{2}$/,
            "O mês deve estar no formato YYYY-MM (ex: 2026-09).",
        )
        .optional()
        .or(z.literal("")),
});

export type GetExpensesQueryInput = z.infer<typeof getExpensesQuerySchema>;

export const expenseIdParamSchema = z.object({
    id: z.uuid("ID da despesa inválido."),
});

export const updateExpenseSchema = z.object({
    household_id: z.uuid("ID da casa inválido."),
    paid_by: z.uuid("ID do pagador inválido."),
    title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
    category: z.string().default("Variável"),
    expense_date: z.string().min(1, "A data da despesa é obrigatória."),
    items: z
        .array(expenseItemSchema)
        .min(1, "A despesa precisa ter pelo menos um item."),
});

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
