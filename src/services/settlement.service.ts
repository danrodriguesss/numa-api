import { db } from "../config/database.js";
import { eq, and, like, inArray } from "drizzle-orm";
import {
    expenses,
    expenseItems,
    householdMembers,
    settlements,
} from "../config/schema.js";

export const calculateSettlementsService = async (
    householdId: string,
    userId: string,
    month: string,
) => {
    // Verifica se o usuário é membro da casa
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

    // Verifica se o mês já foi fechado (evita duplicidade)
    const existingSettlements = await db
        .select()
        .from(settlements)
        .where(
            and(
                eq(settlements.householdId, householdId),
                eq(settlements.referenceMonth, month),
            ),
        );

    if (existingSettlements.length > 0)
        throw new Error("MONTH_ALREADY_SETTLED");

    // Busca todos os moradores da casa
    const members = await db
        .select({ userId: householdMembers.userId })
        .from(householdMembers)
        .where(eq(householdMembers.householdId, householdId));

    if (members.length === 0) throw new Error("NO_MEMBERS");

    // Busca as despesas do mês informado
    const monthExpenses = await db
        .select({ id: expenses.id, paidBy: expenses.paidBy })
        .from(expenses)
        .where(
            and(
                eq(expenses.householdId, householdId),
                like(expenses.expenseDate, `${month}%`),
            ),
        );

    if (monthExpenses.length === 0) throw new Error("NO_EXPENSES");

    // Busca os itens dessas despesas para calcular o valor real
    const expenseIds = monthExpenses.map((e) => e.id);
    const items = await db
        .select()
        .from(expenseItems)
        .where(inArray(expenseItems.expenseId, expenseIds));

    // Calcula quanto cada usuário pagou no total
    const amountPaidByUser: Record<string, number> = {};
    members.forEach((m) => (amountPaidByUser[m.userId] = 0)); // Zera o saldo de todos

    monthExpenses.forEach((expense) => {
        const currentItems = items.filter((i) => i.expenseId === expense.id);
        const total = currentItems.reduce(
            (acc, item) => acc + item.unitPrice * item.quantity,
            0,
        );
        amountPaidByUser[expense.paidBy] =
            (amountPaidByUser[expense.paidBy] ?? 0) + total;
    });

    // Calcula a cota ideal
    const totalMonth = Object.values(amountPaidByUser).reduce(
        (a, b) => a + b,
        0,
    );
    const idealShare = totalMonth / members.length;

    // Separa Devedores (quem pagou menos que a cota) e Credores (quem pagogu mais)
    const balances = members.map((m) => ({
        userId: m.userId,
        balance: (amountPaidByUser[m.userId] ?? 0) - idealShare,
    }));

    const creditors = balances
        .filter((b) => b.balance > 0.01)
        .sort((a, b) => b.balance - a.balance);
    const debtors = balances
        .filter((b) => b.balance < -0.01)
        .sort((a, b) => a.balance - b.balance);

    const newSettlements = [];
    let i = 0; // Index do credor
    let j = 0; // Index do devedor

    // Algoritmo Guloso (Greedy) para cruzar pagamentos
    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i];
        const debtor = debtors[j];

        if (!creditor || !debtor) break;

        // O valor a transferir é o menor entre o que o credor tem a receber e o que o devedor deve
        const amount = Math.min(creditor.balance, Math.abs(debtor.balance));
        const roundedAmount = Math.round(amount * 100) / 100; // Evita dízimas flutuantes (ex: 0.3000004)

        newSettlements.push({
            id: crypto.randomUUID(),
            householdId,
            payerId: debtor.userId,
            receiverId: creditor.userId,
            amount: roundedAmount,
            referenceMonth: month,
            status: "pendente",
        });

        // Abate os saldos
        creditor.balance -= roundedAmount;
        debtor.balance += roundedAmount;

        // Avança a fila caso a dívida/crédito tenha sido zerada
        if (creditor.balance < 0.01) i++;
        if (Math.abs(debtor.balance) < 0.01) j++;
    }

    // Salva no banco de dados e retorna
    if (newSettlements.length > 0) {
        await db.insert(settlements).values(newSettlements);
    }

    return {
        totalMonth: Math.round(totalMonth * 100) / 100,
        idealShare: Math.round(idealShare * 100) / 100,
        transactions: newSettlements,
    };
};
