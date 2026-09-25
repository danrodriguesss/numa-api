import { db } from "../config/database.js";
import {
    expenses,
    expenseItems,
    households,
    householdMembers,
} from "../config/schema.js";
import { eq, and } from "drizzle-orm";
import type { CreateExpenseInput } from "../schemas/expense.schema.js";

export const createExpenseService = async (
    userId: string,
    data: CreateExpenseInput,
) => {
    // Verifica se a casa existe
    const [household] = await db
        .select()
        .from(households)
        .where(eq(households.id, data.household_id));

    if (!household) throw new Error("HOUSEHOLD_NOT_FOUND");

    // Verifica se o usuário autenticado é membro da casa
    const [membership] = await db
        .select()
        .from(householdMembers)
        .where(
            and(
                eq(householdMembers.householdId, data.household_id),
                eq(householdMembers.userId, userId),
            ),
        );

    if (!membership) throw new Error("FORBIDDEN");

    // Executa a gravação da "capa" da despesa e de seus itens em uma transação atômica
    return await db.transaction(async (tx) => {
        // Insere a capa da despesa
        const [newExpense] = await tx
            .insert(expenses)
            .values({
                id: data.id,
                householdId: data.household_id,
                paidBy: data.paid_by,
                title: data.title,
                category: data.category,
                expenseDate: data.expense_date,
            })
            .returning();

        // Mapeia e insere os itens (unitPrice como float/real)
        const itemsToInsert = data.items.map((item) => ({
            id: item.id,
            expenseId: data.id,
            name: item.name,
            unitPrice: item.unit_price,
            quantity: item.quantity,
        }));

        const insertedItems = await tx
            .insert(expenseItems)
            .values(itemsToInsert)
            .returning();

        // Calcula o total dinamicamente para devolver no payload de resposta
        const totalAmount = insertedItems.reduce(
            (acc, item) => acc + item.unitPrice * item.quantity,
            0,
        );

        return {
            ...newExpense,
            totalAmount,
            items: insertedItems,
        };
    });
};
