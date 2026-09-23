import { db } from "../config/database.js";
import { households, householdMembers } from "../config/schema.js";
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
