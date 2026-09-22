import { z } from "zod";
import { isValidCPF } from "../utils/cpfValidator.js";

// Lista de opções de tipo de chave pix permitidas
const pixTypes = z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"]);

export const registerUserSchema = z.object({
    name: z.string().min(3, "O nome dever no mínimo 3 caracteres"),
    email: z.email("Formato do e-mail inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    pixKey: z.string().optional(),
    pixKeyType: pixTypes.optional(),
});

// Extrai a tipagem do Zod para ser usada no TypeScript
export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export const loginSchema = z.object({
    email: z.email("Formato de e-mail inválido"),
    password: z.string().min(1, "A senha é obrigatória"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const updatePixSchema = z
    .object({
        pixKey: z
            .string()
            .min(5, "A chave pix deve ter no mínimo 5 caracteres"),
        pixKeyType: pixTypes,
    })
    .superRefine((data, ctx) => {
        // data: contém o JSON inteiro (pixKey e pixKeyType)
        // ctx: é o contexto do Zod onde os erros são injetados

        if (data.pixKeyType === "EMAIL") {
            // Validação simples usando regex de e-mail
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.pixKey);
            if (!isEmail) {
                ctx.addIssue({
                    code: "custom",
                    path: ["pixKey"], // Diz ao frontend que o erro está no campo pixKey
                    message:
                        "Para o tipo EMAIL, a chave PIX deve ser um e-mail válido.",
                });
            }
        }

        if (data.pixKeyType === "CPF") {
            if (!isValidCPF(data.pixKey)) {
                ctx.addIssue({
                    code: "custom",
                    path: ["pixKey"],
                    message:
                        "Para o tipo CPF, a chave PIX deve ser um CPF válido.",
                });
            }
        }

        if (data.pixKeyType === "CNPJ") {
            // Remove pontos, barras e traços
            const justNumbers = data.pixKey.replace(/\D/g, "");
            if (justNumbers.length !== 14) {
                ctx.addIssue({
                    code: "custom",
                    path: ["pixKey"],
                    message:
                        "Para o tipo CNPJ, a chave PIX deve conter exatamente 14 números.",
                });
            }
        }

        if (data.pixKeyType === "PHONE") {
            const justNumbers = data.pixKey.replace(/\D/g, "");
            // Bloqueia se a pessoa tentar mandar um CPF fingindo ser telefone (telefone começa com DDD válido, não começa com 0)
            // Celulares no Brasil têm 11 dígitos e o terceiro dígito (após o DDD) costuma ser 9.
            if (justNumbers.length !== 11 || justNumbers[2] !== "9") {
                ctx.addIssue({
                    code: "custom",
                    path: ["pixKey"],
                    message:
                        "Para o tipo PHONE, informe um celular válido com DDD (ex: 79999999999).",
                });
            }
        }

        if (data.pixKeyType === "RANDOM") {
            // Regex que valida o formato exato de um UUID (ex: 123e4567-e89b-12d3-a456-426614174000)
            const isUUID =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    data.pixKey,
                );

            if (!isUUID) {
                ctx.addIssue({
                    code: "custom",
                    path: ["pixKey"],
                    message:
                        "A chave aleatória deve estar no formato válido (ex: 123e4567-e89b-12d3-a456-426614174000).",
                });
            }
        }
    });

export type UpdatePixInput = z.infer<typeof updatePixSchema>;
