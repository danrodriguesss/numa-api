# Numa RESTful API

> **NOTA:** Este é o repositório da API RESTful. Para acessar o código e as telas do app móvel, [clique aqui](#link-do-repo-mobile).

O **Numa** é um sistema inteligente para rateio e gerenciamento de finanças compartilhadas em repúblicas, casais e amigos que dividem moradia. Esta API é responsável por processar as regras de negócio, gerenciar o fluxo de despesas detalhadas e calcular a matriz de acerto de contas com o menor número possível de transferências entre os moradores.

## 🛠️ Tecnologias Utilizadas

A arquitetura foi desenhada para alta disponibilidade e performance em ambientes _serverless_ (Edge), garantindo inicializações instantâneas (_zero cold-start_).

- **Ambiente e Linguagem:** Node.js com TypeScript
- **Framework REST:** Fastify (Alta performance e validação nativa de esquemas)
- **Banco de Dados:** Turso (libSQL/SQLite distribuído)
- **ORM:** Drizzle ORM (Leve e otimizado para Edge Computing)
- **Hospedagem:** Vercel

## ⚙️ Regras de Negócio Principais

1. **Registro Granular (Nota Fiscal Digital):** Separação entre o evento da despesa (ex: "Feira") e os itens individuais adquiridos (ex: "Detergente, Qtd: 2, Preço unitário: R$ 2,60"), garantindo transparência total entre os moradores.
2. **Matriz de Acertos (Cálculo de Saldo Líquido):** No dia de corte configurado, a API calcula a "cota ideal" da casa e cruza devedores e credores, gerando rotas diretas de PIX para liquidar as dívidas sem transações intermediárias desnecessárias.
3. **Auditoria e Ajustes:** Despesas de meses já fechados recebem bloqueio lógico para edição. Correções necessárias geram "gastos de ajustes" automáticos no ciclo subsequente.
4. **Dupla Validação de Quitação:** A transição do status da dívida exige o aceite duplo: o devedor sinaliza que o PIX foi feito, e o credor valida o recebimento na conta bancária.

## 📂 Estrutura do Projeto (Arquitetura)

O projeto adota a arquitetura de camadas (Controller-Service-Route) para separar responsabilidades. Isso mantém os arquivos organizados, impede rotas "gordas" e facilita os testes do algoritmo matemático de forma isolada.

```text
/src
  ├── /config         # Conexão com o Turso e variáveis de ambiente
  ├── /routes         # Definição dos endpoints e injeção de validações
  ├── /controllers    # Recebe a requisição, chama o Service e retorna o status HTTP
  ├── /services       # A lógica pesada: algoritmo de fechamento, cálculos de repasse
  ├── /schemas        # Tipagem (ex: Zod) para validar o JSON de entrada
  ├── /middlewares    # Filtros de segurança (ex: verificação do token JWT)
  ├── /utils          # Funções utilitárias (ex: validação de CPF)
  ├── app.ts          # Configuração do Fastify e registro de plugins
  └── server.ts       # Ponto de entrada (entrypoint) para rodar a aplicação
```

## 🗄️ Esquema do Banco de Dados

O banco de dados relacional foi modelado para suportar offline-first no mobile, utilizando UUIDs gerados no cliente e salvos como "TEXT".

```sql
-- Usuários do sistema
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    pix_key TEXT,
    pix_key_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Residências (Grupos)
CREATE TABLE households (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    closing_day INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Relação Usuário <-> Casa
CREATE TABLE household_members (
    id TEXT PRIMARY KEY,
    household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Agrupador da Compra (O Recibo)
CREATE TABLE expenses (
    id TEXT PRIMARY KEY,
    household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    paid_by TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    expense_date TEXT NOT NULL,
    receipt_image_url TEXT,
    is_adjustment INTEGER DEFAULT 0,
    original_expense_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Detalhamento da Compra (Os Itens)
CREATE TABLE expense_items (
    id TEXT PRIMARY KEY,
    expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Registro de Transferências e Dívidas do Mês
CREATE TABLE settlements (
    id TEXT PRIMARY KEY,
    household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    payer_id TEXT NOT NULL REFERENCES users(id),
    receiver_id TEXT NOT NULL REFERENCES users(id),
    amount REAL NOT NULL,
    reference_month TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🛣️ Endpoints Mapeados (MVP)

A API fornece comunicação via formato JSON. As rotas são protegidas via JWT.

### Autenticação e Usuários

| Método     | Endpoint         | Ação                                  |
| ---------- | ---------------- | ------------------------------------- |
| **POST**   | `/auth/register` | Cria uma nova conta                   |
| **POST**   | `/auth/login`    | Autentica o usuário e devolve o token |
| **GET**    | `/users/me`      | Retorna o perfil logado               |
| **PATCH**  | `/users/me/pix`  | Atualiza a chave PIX                  |

### Casas e Membros (Households)

| Método   | Endpoint                  | Ação                                          |
| -------- | ------------------------- | --------------------------------------------- |
| **POST** | `/households`             | Cria uma nova casa e gera o código de convite |
| **POST** | `/households/join`        | Ingressa em uma casa com código de convite    |
| **GET**  | `/households/:id/members` | Lista os moradores de uma casa                |

### Gestão de Gastos (Expenses)

| Método     | Endpoint        | Ação                                                   |
| ---------- | --------------- | ------------------------------------------------------ |
| **POST**   | `/expenses`     | Salva o recibo e o array de itens simultaneamente      |
| **GET**    | `/expenses`     | Lista de despesas com filtros (?userId=X&month=YYY-MM) |
| **PUT**    | `/expenses/:id` | Edita o container (capa) ou itens de uma despesa       |
| **DELETE** | `/expenses/:id` | Remove a despesa (com cascata nos itens)               |

**Exemplo de Payload para Cadastro de Despesa (`POST /expenses`):**
O aplicativo mobile deve gerar os UUIDs (tanto da despesa quanto dos itens) localmente antes de enviar para a API.

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "household_id": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
    "paid_by": "f8a9b0c1-d2e3-4f5a-6b7c-8d9e0f1a2b3c",
    "title": "Mercado Assaí - Limpeza e Água",
    "category": "Variável",
    "expense_date": "2026-09-15",
    "items": [
        {
            "id": "11111111-2222-3333-4444-555555555555",
            "name": "Galão de água 20L",
            "unit_price": 7.0,
            "quantity": 4
        },
        {
            "id": "66666666-7777-8888-9999-000000000000",
            "name": "Detergente Neutro",
            "unit_price": 2.6,
            "quantity": 2
        }
    ]
}
```

### Acerto de Contas (Settlements)

| Método    | Endpoint                      | Ação                                      |
| --------- | ----------------------------- | ----------------------------------------- |
| **POST**  | `/households/:id/settle`      | Dispara o algoritmo de fechamento do mês  |
| **GET**   | `/households/:id/settlements` | Retorna a matriz de quem deve a quem      |
| **PATCH** | `/settlements/:id/pay`        | Devedor sinaliza que o PIX foi realizado  |
| **PATCH** | `/settlements/:id/confirm`    | Credor valida a entrada na conta bancária |

## 📦 PAdrão de Respostas (JSON)

Para facilitar a integração com o app móvel, todas as respostas da API são encapsuladas em um formato padrão (envelope), garantindo previsibilidade no tratamento de dados e erros no frontend.

### ✅ Sucesso (2xx)

Requisições bem-sucedidas sempre retornam a propriedade `success: true` e os dados ficam contidos dentro do objeto `data`. (Se for uma listagem, `data` será uma arra []).

```json
{
    "success": true,
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "status": "pago"
    }
}
```

### ❌ Erro de Regra de Negócio (400, 401, 403, 404)

Quando uma regra é violada (ex.: tentar editar um mês já fechado), a API retorna `success: false` e um objeto `error` com um código interno e uma mensagem clara para ser exibida aos usuário.

```json
{
    "success": false,
    "error": {
        "code": "MONTH_ALREADY_SETTLED",
        "message": "Não é possível alterar despesas de um mês que já foi fechado."
    }
}
```

### ⚠️ Erro de Validação de Dados (422)

Quando o app envia dados no formato incorreto ou faltando campos obrigatórios (tratado via validação de Schemas), a API retorna uma lista de detalhes para facilitar o debug.

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Dados inválidos na requisição.",
        "details": [
            {
                "field": "title",
                "message": "O título da despesa é obrigatório."
            },
            {
                "field": "items[0].unit_price",
                "message": "O preço unitário deve ser maior que zero."
            }
        ]
    }
}
```
