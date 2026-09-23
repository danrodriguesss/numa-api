import { z } from "zod";

export const createHouseholdSchema = z.object({
    name: z.string().min(5, "O nome da casa deve ter no mínimo 5 caracteres."),
    closingDay: z
        .number()
        .min(1)
        .max(31, "O dia de fechamento deve ser entre 1 e 31."),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;

export const joinHouseholdSchema = z.object({
    inviteCode: z.string().min(1, "O código de convite é obrigatório."),
});

export const householdParamsSchema = z.object({
    id: z.uuid("ID da casa inválido (deve ser um UUID)"),
});
