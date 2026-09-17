import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import "dotenv/config"; // Injeta as variáveis do arquivo .env

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("Faltam credenciais do Turso no arquivo .env");
}

// Cria a conexão com o banco de dados
const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Exporta o banco pronto para uso
export const db = drizzle(client);
