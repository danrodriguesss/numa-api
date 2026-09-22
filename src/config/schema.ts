import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// 1. Tabela de Usuários
export const users = sqliteTable("users", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    avatarUrl: text("avatar_url"),
    pixKey: text("pix_key"),
    pixKeyType: text("pix_key_type"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 2. Tabela de Casas (Grupos)
export const households = sqliteTable("households", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    inviteCode: text("invite_code").notNull().unique(),
    closingDay: integer("closing_day").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 3. Tabela de Moradores (Relação Usuário <-> Casa)
export const householdMembers = sqliteTable("household_members", {
    id: text("id").primaryKey(),
    householdId: text("household_id")
        .notNull()
        .references(() => households.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    joinedAt: text("joined_at").default(sql`CURRENT_TIMESTAMP`),
});

// 4. Tabela de Despesas (O "Recibo")
export const expenses = sqliteTable("expenses", {
    id: text("id").primaryKey(),
    householdId: text("household_id")
        .notNull()
        .references(() => households.id, { onDelete: "cascade" }),
    paidBy: text("paid_by")
        .notNull()
        .references(() => users.id),
    title: text("title").notNull(),
    category: text("category").notNull(),
    expenseDate: text("expense_date").notNull(),
    receiptImageUrl: text("receipt_image_url"),
    isAdjustment: integer("is_adjustment").default(0), // 0 = False, 1 = True
    originalExpenseId: text("original_expense_id"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 5. Tabela de Itens da Despesa
export const expenseItems = sqliteTable("expense_items", {
    id: text("id").primaryKey(),
    expenseId: text("expense_id")
        .notNull()
        .references(() => expenses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    unitPrice: real("unit_price").notNull(),
    quantity: integer("quantity").notNull().default(1),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 6. Tabela de Acertos de Contas
export const settlements = sqliteTable("settlements", {
    id: text("id").primaryKey(),
    householdId: text("household_id")
        .notNull()
        .references(() => households.id, { onDelete: "cascade" }),
    payerId: text("payer_id")
        .notNull()
        .references(() => users.id),
    receiverId: text("receiver_id")
        .notNull()
        .references(() => users.id),
    amount: real("amount").notNull(),
    referenceMonth: text("status").default("pendente"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
