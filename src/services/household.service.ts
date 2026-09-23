import { eq, and } from "drizzle-orm";
import { db } from "../config/database.js";
import { households, householdMembers, users } from "../config/schema.js";
import type { CreateHouseholdInput } from "../schemas/household.schema.js";

// Helper para gerar um código de convite curto (ex: NUMA-X8B9)
const generateInviteCode = () => {
    return "NUMA-" + Math.random().toString(36).substring(2, 6).toUpperCase();
};

export const createHouseholdService = async (
    data: CreateHouseholdInput,
    userId: string,
) => {
    const householdId = crypto.randomUUID();
    const inviteCode = generateInviteCode();

    // inicia transação. Se algo falhar aqui dentro, o banco faz ROLLBACK.
    await db.transaction(async (tx) => {
        // Cria a casa
        await tx.insert(households).values({
            id: householdId,
            name: data.name,
            inviteCode,
            closingDay: data.closingDay,
        });

        // Coloca quem criou a casa como membro e Administrador
        await tx.insert(householdMembers).values({
            id: crypto.randomUUID(),
            householdId: householdId,
            userId: userId,
            role: "admin",
        });
    });

    // Retorna os dados resumidos para o Controller
    return {
        id: householdId,
        name: data.name,
        inviteCode,
        closingDay: data.closingDay,
    };
};

export const listUserHouseholdsService = async (userId: string) => {
    // Faz un JOIN obtendo a casa, mas apenas onde o usuário logado é membro
    const userHouseholds = await db
        .select({
            id: households.id,
            name: households.name,
            inviteCode: households.inviteCode,
            closingDay: households.closingDay,
            role: householdMembers.role,
            joinedAt: householdMembers.joinedAt,
        })
        .from(households)
        .innerJoin(
            householdMembers,
            eq(households.id, householdMembers.householdId),
        )
        .where(eq(householdMembers.userId, userId));

    return userHouseholds;
};

export const joinHouseholdService = async (
    userId: string,
    inviteCode: string,
) => {
    // Busca a casa pelo código de convite
    const [household] = await db
        .select()
        .from(households)
        .where(eq(households.inviteCode, inviteCode));

    if (!household) throw new Error("INVALID_INVITE_CODE");

    // Verifica se o usuário já é membro dessa casa
    const [existingMember] = await db
        .select()
        .from(householdMembers)
        .where(
            and(
                eq(householdMembers.householdId, household.id),
                eq(householdMembers.userId, userId),
            ),
        );

    if (existingMember) throw new Error("ALREADY_A_MEMBER");

    // Insere o usuário na casa como "member" (membro comum, não admin)
    await db.insert(householdMembers).values({
        id: crypto.randomUUID(),
        householdId: household.id,
        userId: userId,
        role: "member",
    });

    // Retorna os dados da casa, para mostrar onde o usuário acabou de entrar.
    return household;
};

export const getHouseholdDetailsService = async (
    householdId: string,
    userId: string,
) => {
    // Busca os dados da casa
    const [household] = await db
        .select({
            id: households.id,
            name: households.name,
            inviteCode: households.inviteCode,
            closingDay: households.closingDay,
            createdAt: households.createdAt,
        })
        .from(households)
        .where(eq(households.id, householdId));

    if (!household) throw new Error("HOUSEHOLD_NOT_FOUND");

    // Checa se o usuário logado é membro desta casa
    const [membership] = await db
        .select()
        .from(householdMembers)
        .where(
            and(
                eq(householdMembers.householdId, householdId),
                eq(householdMembers.userId, userId),
            ),
        );

    if (!membership) throw new Error("FORBIDDEN");

    // Buscar todos os membros da casa com seus dados públicos (Nome, Avatar e PIX)
    const members = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            avatarUrl: users.avatarUrl,
            pixKey: users.pixKey,
            pixKeyType: users.pixKeyType,
            role: householdMembers.role,
            joinedAt: householdMembers.joinedAt,
        })
        .from(householdMembers)
        .innerJoin(users, eq(householdMembers.userId, users.id))
        .where(eq(householdMembers.householdId, householdId));

    return {
        ...household,
        members,
    };
};
