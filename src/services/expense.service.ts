import { db } from "../config/database.js";
import {
    expenses,
    expenseItems,
    households,
    householdMembers,
} from "../config/schema.js";
import { eq, and, like, inArray, desc } from "drizzle-orm";
import type {
    CreateExpenseInput,
    GetExpensesQueryInput,
    UpdateExpenseInput,
} from "../schemas/expense.schema.js";

export const createExpenseService = async (
    userId: string,
    data: CreateExpenseInput,
) => {
    // Verifica se já existe uma despesa com esse ID
    const [existingExpense] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, data.id));

    if (existingExpense) throw new Error("EXPENSE_ALREADY_EXISTS");

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

export const getExpensesService = async (
    authUserId: string,
    filters: GetExpensesQueryInput,
) => {
    // Verifica se o usuário autenticado pertence à casa informada
    const [membership] = await db
        .select()
        .from(householdMembers)
        .where(
            and(
                eq(householdMembers.householdId, filters.householdId),
                eq(householdMembers.userId, authUserId),
            ),
        );

    if (!membership) throw new Error("FORBIDDEN");

    // Monta as condições dinâmicas de busca
    const conditions = [eq(expenses.householdId, filters.householdId)];

    if (filters.userId) conditions.push(eq(expenses.paidBy, filters.userId));

    // Busca todas as datas que começam com "YYYY-MM"
    if (filters.month)
        conditions.push(like(expenses.expenseDate, `${filters.month}%`));

    // Busca as capas das despesas
    const expenseList = await db
        .select({
            id: expenses.id,
            householdId: expenses.householdId,
            paidBy: expenses.paidBy,
            title: expenses.title,
            category: expenses.category,
            expenseDate: expenses.expenseDate,
            createdAt: expenses.createdAt,
        })
        .from(expenses)
        .where(and(...conditions))
        .orderBy(desc(expenses.expenseDate));

    if (expenseList.length === 0) return [];

    // Buscar os itens das despesas encontradas
    const expenseIds = expenseList.map((e) => e.id);
    const items = await db
        .select()
        .from(expenseItems)
        .where(inArray(expenseItems.expenseId, expenseIds));

    // Agrupa os itens em suas respectivas despesas e calcula o total
    return expenseList.map((expense) => {
        const currentItems = items.filter(
            (item) => item.expenseId === expense.id,
        );
        const totalAmount = currentItems.reduce(
            (acc, item) => acc + item.unitPrice * item.quantity,
            0,
        );

        return {
            ...expense,
            totalAmount,
            items: currentItems,
        };
    });
};

export const updateExpenseService = async (
    expenseId: string,
    userId: string,
    data: UpdateExpenseInput,
) => {
    // Verifica se a despesa existe no banco
    const [existingExpense] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, expenseId));

    if (!existingExpense) throw new Error("EXPENSE_NOT_FOUND");

    // Verifica se o usuário tem permissão (é membro da casa à qual a despesa já pertence).
    // Usa existingExpense.householdId por segurança, para evitar que o usuário tente "roubar"
    // a despesa mudando o householdId
    const [membership] = await db
        .select()
        .from(householdMembers)
        .where(
            and(
                eq(householdMembers.householdId, existingExpense.householdId),
                eq(householdMembers.userId, userId),
            ),
        );

    if (!membership) throw new Error("FORBIDDEN");

    // Transação atômica: Atualiza capa, limpa itens antigos e insere os novos
    return await db.transaction(async (tx) => {
        // Atualiza a capa da despesa
        const [updatedExpense] = await tx
            .update(expenses)
            .set({
                paidBy: data.paid_by,
                title: data.title,
                category: data.category,
                expenseDate: data.expense_date,
            })
            .where(eq(expenses.id, expenseId))
            .returning();

        // Deleta TODOS os itens antigos atrelados a esta despesa
        await tx
            .delete(expenseItems)
            .where(eq(expenseItems.expenseId, expenseId));

        // Insere a nova lista de itens enviada pelo front-end
        const itemsToInsert = data.items.map((item) => ({
            id: item.id,
            expenseId: expenseId, // Vincula ao ID da URL
            name: item.name,
            unitPrice: item.unit_price,
            quantity: item.quantity,
        }));

        const insertedItems = await tx
            .insert(expenseItems)
            .values(itemsToInsert)
            .returning();

        // Recalcula o total
        const totalAmount = insertedItems.reduce(
            (acc, item) => acc + item.unitPrice * item.quantity,
            0,
        );

        return {
            ...updatedExpense,
            totalAmount,
            items: insertedItems,
        };
    });
};
