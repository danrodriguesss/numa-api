import { db } from "../config/database.js";
import { users } from "../config/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { RegisterUserInput, LoginInput } from "../schemas/user.schema.js";

export const createUserService = async (data: RegisterUserInput) => {
    // Verifica se o e-mail já existe no banco
    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .get(); // .get() retorna apenas 1 resultado no Drizzle SQLite

    if (existingUser) throw new Error("EMAIL_ALREADY_EXISTS");

    // Criptografa a senha
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Salva no banco de dados
    const [newUser] = await db
        .insert(users)
        .values({
            id: crypto.randomUUID(),
            name: data.name,
            email: data.email,
            passwordHash: passwordHash,
            pixKey: data.pixKey,
        })
        .returning({
            id: users.id,
            name: users.name,
            email: users.email,
        }); // Retorna apenas dados seguros (sem a senha)

    return newUser;
};

export const authenticateUserService = async (data: LoginInput) => {
    // Busca o usuário pelo e-mail
    const user = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .get();

    // Se não achar o usuário, ou se a senha não bater, retorna o mesmo erro
    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const isValidPassword = await bcrypt.compare(
        data.password,
        user.passwordHash,
    );
    if (!isValidPassword) {
        throw new Error("INVALID_CREDENTIALS");
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
    };
};
