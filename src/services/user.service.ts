import { db } from "../config/database.js";
import { users } from "../config/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type {
    RegisterUserInput,
    LoginInput,
    UpdatePixInput,
} from "../schemas/user.schema.js";

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
            pixKeyType: data.pixKeyType,
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

export const getUserProfileService = async (userId: string) => {
    const user = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            pixKey: users.pixKey,
            pixKeyType: users.pixKeyType,
            avatarUrl: users.avatarUrl,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .get();

    if (!user) throw new Error("USER_NOT_FOUND");

    return user;
};

export const updatePixKeyService = async (
    userId: string,
    data: UpdatePixInput,
) => {
    // Atualiza a linha onde o ID é igual ao ID do usuário logado e retorna o novo valor
    const [updatedUser] = await db
        .update(users)
        .set({ pixKey: data.pixKey, pixKeyType: data.pixKeyType })
        .where(eq(users.id, userId))
        .returning({
            id: users.id,
            pixKey: users.pixKey,
            pixKeyType: users.pixKeyType,
        });

    if (!updatedUser) throw new Error("USER_NOT_FOUND");

    return updatedUser;
};
