# Arquitetura de Dados: Torre de Controle vs ERP

Este documento define o padrão arquitetural para o desenvolvimento do módulo de Torre de Controle e Cronograma, garantindo a separação de responsabilidades entre o ERP Oficial (Esteira Contador) e a Camada Operacional (TMS).

## 🏗️ Conceito Fundamental: "Split-Database"

O sistema opera com dois contextos de dados distintos, mesmo que fisicamente possam residir no mesmo arquivo SQLite durante o desenvolvimento/prototipagem.

### 1. 🔒 Contexto ERP Oficial (Read-Only)
Representa o banco de dados legado/oficial da empresa (PostgreSQL na produção).
*   **Regra de Ouro**: NUNCA escrevemos nestas tabelas.
*   **Responsabilidade**: Fonte da verdade fiscal e cadastral.
*   **Tabelas (Exemplos)**:
    *   `trips` (Viagens)
    *   `loads` (Cargas)
    *   `vehicles` (Veículos)
    *   `clients` (Clientes)
    *   `cities` (Cidades)

### 2. 📝 Contexto Torre de Controle (Read/Write)
Representa a inteligência operacional complementando o ERP. É um banco SQLite (na produção, pode ser um schema separado ou outro banco) onde temos total liberdade.
*   **Regra de Ouro**: Tudo que precisamos criar/editar fica aqui.
*   **Naming Convention**: Todas as tabelas devem ter o prefixo **`tmsvc_`**.
*   **Tabelas Criadas**:
    *   `tmsvc_cronograma`: Otimizada para renderização da Timeline (cache visual).
    *   `tmsvc_viagem_ref`: Espelho da viagem do ERP + metadados operacionais extras.
    *   `tmsvc_evento_operacional`: Log de auditoria e eventos da torre.
    *   `tmsvc_status_consolidado`: KPIs para dashboards rápidos.

---

## 🔄 Mecanismo de Sincronização (Sync)

Como o ERP é Read-Only, precisamos copiar os dados para o noss contexto para poder trabalhar.

1.  **Gatilho**: O endpoint `POST /api/sync` é acionado (manualmente ou por cron/job).
2.  **Fluxo**:
    *   Lê `trips` e `vehicles` do Contexto ERP.
    *   **Upsert** (Insert ou Update) na tabela `tmsvc_viagem_ref`.
    *   Calcula status visuais (Cores, Atrasos).
    *   Atualiza `tmsvc_cronograma`.
3.  **Resultado**: A UI da Torre de Controle consome **apenas** as tabelas `tmsvc_*`, garantindo performance e desacoplamento.

## 🧭 Guia para Desenvolvedores

### "Preciso adicionar uma coluna 'Motivo do Atraso' na viagem."
*   ❌ **Errado**: Tentar criar coluna `reason_delay` na tabela `trips`.
*   ✅ **Correto**: Criar coluna `motivo_atraso` na tabela `tmsvc_viagem_ref` (ou numa nova tabela `tmsvc_viagem_detalhes`).

### "Preciso mudar o status da viagem para 'Em Trânsito'."
*   **Fluxo Ideal**:
    1.  Atualiza o status na tabela `tmsvc_viagem_ref`.
    2.  (Opcional) Envia um comando para API do ERP (se existir integração de escrita futura).
    3.  A timeline lê de `tmsvc_cronograma` (que reflete o `tmsvc_viagem_ref`).

---

## 🗺️ Mapa de Tabelas

| Tabela ERP (Origem) | Tabela Torre (Destino/Espelho) | Função |
| :--- | :--- | :--- |
| `trips` | `tmsvc_viagem_ref` | Armazena ID original + Status Operacional customizado. |
| *(Agregação)* | `tmsvc_cronograma` | Tabela "boba" e rápida para pintar a tela de cronograma. |
| N/A | `tmsvc_evento_operacional` | Histórico de ações (quem mudou o que e quando). |

---

## 🧱 Modelo Alvo: Viagem → Carga (Leg) → CT-e → NF-e

Para manter coerência entre operação e fiscal (SEFAZ), adotamos o seguinte modelo lógico:

- **Viagem (`Trip`)**: envelope operacional do veículo/motorista.
- **Carga (`Leg` com `type='LOAD'`)**: unidade operacional do serviço (trecho) — **cada Carga tende a gerar 1 CT-e**.
- **Entrega (`Delivery`)**: parada/ponto de descarga. No modelo alvo, cada `Leg (LOAD)` deve ter **1 entrega principal**.
- **CT-e (`Document` `type='CTe'`)**: documento fiscal do transporte daquela Carga.
- **NF-e (`Document` `type='NF'`)**: documentos da mercadoria consolidados no CT-e.

### Regras Operacionais

- **CT-e por destino (regra geral)**: destinos fiscais distintos (CNPJ/CPF distinto) ⇒ CT-es distintos ⇒ múltiplas Cargas (`Legs`) na mesma Viagem.
- **Seleção Top-Down (cascata)**:
  - Selecionar um CT-e deve identificar as NF-es vinculadas (por chaves/relacionamentos) e “bloqueá-las” no backlog para evitar dupla alocação.
  - A soma de peso/valor do card da Carga e da Viagem deve refletir o agregado das NF-es vinculadas.
- **Subcontratação**:
  - CT-e subcontratado deve ser marcado explicitamente (`isSubcontracted`) e, futuramente, apontar para o CT-e original do contratante.

### Fonte de Dados (DF-e)

O export `fis_documento_dfe_*.xml` é a base documental (NF-e/CT-e). Ele permite extrair:

- **NF-e**: valor da mercadoria, peso (quando informado), destinatário e destino.
- **CT-e**: valor do frete e referências de NF-e (quando presentes).

Campos operacionais (SLA/janelas/requisitos) geralmente **não** vêm do DF-e e devem ser complementados pelo TMS.

*Documento criado em: 27/01/2026*
