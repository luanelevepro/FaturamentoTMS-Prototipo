# Modelagem: Carga vs CT-e vs Entrega

## Visão Geral

Este documento explica a distinção arquitetural entre **Carga**, **CT-e** e **Entrega** no sistema, e como eles são tratados visualmente vs. arquiteturalmente.

## Regra Visual/Operacional (Para o Usuário)

**Carga, CT-e e Entrega são tratados como UMA UNIDADE INDIVISÍVEL (1:1:1)**

No dia a dia da operação, o usuário verá tudo como um único objeto:

- **O Card na Tela**: Representa a demanda logística
- **A Carga**: É o agrupamento físico (as 10 caixas da Amazon)
- **O CT-e**: É o documento que legaliza essas 10 caixas
- **A Entrega**: É o destino final dessas 10 caixas

**Regra do Sistema:**
> "Eu tenho uma Carga (Card #CRG-2), que gera um único CT-e, para realizar uma única Entrega no Rio de Janeiro."

Portanto, **SIM**, visualmente e operacionalmente, trate como um objeto só.

## Regra Arquitetural (Para o Banco de Dados)

São entidades **SEPARADAS** com ciclos de vida distintos. Você não pode criar uma tabela única onde a Primary Key seja o número do CT-e, porque:

1. A Carga existe **antes** do CT-e
2. A Carga pode **sobreviver** após cancelamento do CT-e
3. A Entrega pode ter **múltiplas tentativas** (reentregas)

### A. A Carga (A Demanda)

**O que é:** O registro da necessidade do cliente (ex: "Tenho mercadoria para levar para o RJ")

**Quando nasce:** No momento em que as NF-es sobem para o sistema e caem no "Backlog"

**Status:** `Pending` → `Scheduled` → `Emitted` → `Delivered`

**Observação:** No status `Pending`, não existe CT-e ainda.

**Tabela:** `loads`

**Campos principais:**
- `id` (PK)
- `client_id`
- `status` ('Pending', 'Scheduled', 'Emitted', 'Delivered')
- `origin_city`, `destination_city`
- `collection_date`

### B. O CT-e (O Documento)

**O que é:** A formalização fiscal dessa carga

**Quando nasce:** Quando o usuário clica em "Programar Veículo" e o sistema autoriza na SEFAZ

**Status:** `Pending` → `Authorized` → (pode ser) `Cancelled`

**Risco Técnico:** Se o usuário errar e precisar cancelar o CT-e:
- O CT-e morre (fica cancelado)
- A **Carga** (o card no backlog) **NÃO pode sumir**
- A Carga volta para o status `Pending` para ser emitida novamente com um novo número de CT-e

**Tabela:** `ctes`

**Campos principais:**
- `id` (PK)
- `load_id` (FK → `loads.id`) - **FK_CARGA**
- `number` - Número do CT-e
- `access_key` - Chave de acesso (SEFAZ)
- `freight_value` - Valor do frete
- `status` ('Pending', 'Authorized', 'Cancelled')
- `emission_date`, `authorization_date`, `cancellation_date`

**Regra de Cancelamento:**
Se cancelar o CT-e, você cria um **novo registro** em `ctes` e aponta para a mesma `load_id`.

### C. A Entrega (O Evento)

**O que é:** A confirmação de que o serviço acabou

**Quando nasce:** Quando ocorre uma tentativa de entrega

**Status:** `Pending` → `Delivered` | `Failed` | `Returned`

**Cenário de Reentrega:**
O motorista chega na Amazon, mas o galpão está fechado:
- **Tentativa de Entrega 1**: Status = `Failed`, `failure_reason` = "Galpão fechado"
- O CT-e continua válido
- A Carga continua no caminhão
- **Tentativa de Entrega 2**: Status = `Delivered`

**Resultado:**
- Carga: **1**
- CT-e: **1**
- Eventos de Entrega: **2** (1 falha, 1 sucesso)

**Tabela:** `deliveries`

**Campos principais:**
- `id` (PK)
- `leg_id` (FK → `legs.id`)
- `load_id` (FK → `loads.id`) - Para facilitar consultas
- `attempt_number` - Número da tentativa (1, 2, 3...)
- `status` ('Pending', 'Delivered', 'Returned', 'Failed')
- `delivery_date`, `failure_reason`

### D. A Viagem (O Agrupador)

**O que é:** O agrupamento operacional de múltiplas cargas

**Quando nasce:** Quando um veículo + motorista são vinculados a uma ou mais cargas

**Tabela:** `trips`

**Relacionamento:**
- Uma Viagem pode conter **várias Cargas**
- Cada Carga pode ter seu próprio CT-e
- Cada Carga pode ter múltiplas tentativas de entrega

## Estrutura do Banco de Dados

### Hierarquia

```
trips (Viagem)
  └── legs (Pernas da viagem)
       ├── load_id → loads (Carga vinculada)
       └── deliveries (Eventos de entrega)
            ├── load_id → loads (Vínculo direto)
            └── documents (NF-es vinculadas)
                 └── cte_id → ctes (Referência ao CT-e)

loads (Carga - TABELA MESTRE)
  └── ctes (CT-es vinculados)
       └── load_id → loads.id (FK_CARGA)
```

### Tabelas Principais

#### `loads` (O Mestre/Card)
- `id` (PK)
- `client_id` (FK)
- `status` ('Pending', 'Scheduled', 'Emitted', 'Delivered')
- Esta é a tabela que alimenta o Kanban

#### `ctes` (O Documento)
- `id` (PK)
- `load_id` (FK → `loads.id`) - **FK_CARGA**
- `access_key` (UNIQUE) - Chave de acesso SEFAZ
- `freight_value` - Valor do frete
- `status` ('Pending', 'Authorized', 'Cancelled')
- Se cancelar o CT-e, você cria um novo registro aqui e aponta para a mesma `load_id`

#### `deliveries` (O Evento)
- `id` (PK)
- `leg_id` (FK → `legs.id`)
- `load_id` (FK → `loads.id`) - Para facilitar consultas
- `attempt_number` - Número da tentativa
- `status` ('Pending', 'Delivered', 'Returned', 'Failed')
- Pode haver múltiplos registros para a mesma carga (reentregas)

#### `trips` (O Agrupador)
- `id` (PK)
- Contém várias CARGAS (via `legs.load_id`)

## Veredito Final

**Para o usuário final (o operador da tela):**
- Sim, é tudo uma coisa só
- Ele clica no card da carga e vê o número do CT-e e o status da entrega

**Para você (backend):**
- Mantenha a **Carga** como a entidade pai
- Mantenha o **CT-e** como um atributo filho dela
- Mantenha a **Entrega** como eventos separados (suportando reentregas)

Isso te salva de dores de cabeça quando houver:
- Cancelamentos de CT-e
- Reentregas
- Múltiplas tentativas de entrega

## Exemplos Práticos

### Exemplo 1: Fluxo Feliz (1:1:1)
1. NF-es sobem → Carga criada (`status: 'Pending'`)
2. Usuário programa veículo → CT-e emitido (`status: 'Authorized'`), Carga atualizada (`status: 'Emitted'`)
3. Motorista entrega → Entrega criada (`status: 'Delivered'`), Carga atualizada (`status: 'Delivered'`)

**Resultado:** 1 Carga, 1 CT-e, 1 Entrega ✅

### Exemplo 2: Cancelamento de CT-e
1. CT-e emitido → Carga (`status: 'Emitted'`), CT-e (`status: 'Authorized'`)
2. Erro detectado → CT-e cancelado (`status: 'Cancelled'`), **mas Carga continua existindo**
3. Novo CT-e emitido → Novo registro em `ctes` apontando para mesma `load_id`

**Resultado:** 1 Carga, 2 CT-es (1 cancelado, 1 ativo) ✅

### Exemplo 3: Reentrega
1. CT-e emitido → Carga (`status: 'Emitted'`), CT-e (`status: 'Authorized'`)
2. Tentativa 1 falha → Entrega 1 (`status: 'Failed'`, `attempt_number: 1`)
3. Tentativa 2 sucesso → Entrega 2 (`status: 'Delivered'`, `attempt_number: 2`)

**Resultado:** 1 Carga, 1 CT-e, 2 Entregas (1 falha, 1 sucesso) ✅
