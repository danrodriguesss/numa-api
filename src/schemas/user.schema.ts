import { z } from "zod";

export const registerUserSchema = z.object({
    name: z.string().min(3, "O nome dever no mínimo 3 caracteres"),
    email: z.email("Formato do e-mail inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    pixKey: z.string().optional(),
});

// Extrai a tipagem do Zod para ser usada no TypeScript
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
