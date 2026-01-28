# Fluxo Operacional da Torre de Controle

## Visão Geral

Este documento descreve o fluxo operacional completo implementado no sistema, baseado nos segmentos operacionais da Tomazi e no fluxo lógico de emissão de CT-e por carga.

## 1. Match de Segmentos (A Trava de Segurança)

### Conceito
O sistema filtra veículos compatíveis com base no segmento operacional da carga (ex: Ração, Palete, Tijolo).

### Implementação
- **Arquivo**: `config/segmentos.ts`
- **Função**: `filterCompatibleVehicles()`
- **Regra**: Cada segmento define tipos de veículo e carrocerias compatíveis

### Exemplo
- **Carga**: TIJOLO (exige carroceria aberta/sider)
- **Filtro**: Oculta veículos do tipo "Silo" (Ração) ou "Tanque"
- **Resultado**: Mostra apenas veículos compatíveis (Sider, Prancha, Basculante)

### Segmentos Configurados
- **Ração**: Silo, Graneleira
- **Palete**: Baú, Sider, Frigorífico
- **Tijolo**: Sider, Prancha, Basculante
- **Graneleiro**: Graneleira, Silo
- **Frigorífico**: Frigorífico
- **Industrial**: Baú, Sider, Prancha
- **E-commerce**: Baú, Sider

## 2. Fluxo de Emissão "Just-in-Time" (Botão por Carga)

### Conceito
Cada carga dentro de uma viagem tem seu próprio ciclo de vida fiscal. O botão "EMITIR CT-e" aparece apenas quando necessário.

### Estados da Carga
1. **Pending**: Carga no backlog, sem CT-e
2. **Scheduled**: Vinculada à viagem, aguardando emissão de CT-e
3. **Emitted**: CT-e emitido e autorizado na SEFAZ
4. **Delivered**: Entrega concluída

### Interface (UX)
- **Card da Carga**: Mostrado dentro do card da viagem (expandível)
- **Estado Inicial**: Botão amarelo/laranja "EMITIR CT-e"
- **Ação**: Usuário clica → Sistema envia DF-e (NF-es) + Motorista/Veículo para SEFAZ
- **Estado Pós-Clique**: Botão muda para "Check Verde" (Emitido)

### Componente
- **Arquivo**: `components/LoadCardInTrip.tsx`
- **Props**: `onEmitCTe` callback para emitir CT-e

## 3. Máquina de Estados da Viagem

### Chronologia Completa

| Etapa | Ação do Usuário | Status da Viagem | Status da Carga | Requisito |
|-------|----------------|------------------|-----------------|-----------|
| 1. Planejamento | Arrastar Carga p/ Veículo | `Planned` (Aguardando Doc) | `Pending` → `Scheduled` | Match de Segmento OK |
| 2. Fiscal | Clicar "Emitir CT-e" na Carga | `Planned` (Aguardando Coleta) | `Scheduled` → `Emitted` | Autorização SEFAZ (CT-e + MDF-e) |
| 3. Coleta | Clicar "Iniciar Coleta" | `Picking Up` (Em Coleta) | `Emitted` (Em Coleta) | Motorista chegou na origem |
| 4. Transporte | Clicar "Iniciar Viagem" | `In Transit` (Em Rota) | `Emitted` (Em Trânsito) | Carga coletada, caminhão saiu |
| 5. Entrega | Clicar "Finalizar" | `Completed` (Entregue) | `Delivered` | Comprovante de entrega |

### Transições de Estado

```
Pending → Scheduled → Emitted → Delivered
   ↓         ↓           ↓          ↓
Planned → Planned → Picking Up → In Transit → Completed
```

## 4. Logística de Retorno (Adicionar Carga em Movimento)

### Conceito
A viagem é um "Container Aberto" que permite adicionar cargas mesmo quando já está em movimento.

### Cenário
1. Motorista Pedro Oliveira está "Em Rota" para Panambi com Carga de Ida
2. Aparece uma carga de "FARINHA TURVO" voltando de Panambi para a base
3. Usuário localiza a Viagem Ativa do Pedro (coluna "Em Rota")
4. Sistema permite "arrastar" essa nova carga para dentro do card do Pedro

### Implementação
- **Modal**: `components/ScheduleLoadModal.tsx`
- **Seção**: "Em Rota - Adicionar Retorno"
- **Funcionalidade**: Permite selecionar veículos em movimento compatíveis

### Novo Ciclo
- Nova carga entra na viagem com status `Pending`
- Botão "EMITIR CT-e" aparece apenas para essa nova carga
- Sistema atualiza rota para incluir novo destino final (retorno)

### Hierarquia Visual

```
[VIAGEM #1003 - EM ROTA - Veículo TRK-5678 (Segmento: Graneleiro)]
│
├── [CARGA 1: IDA] (Status: Em Trânsito)
│   └── CT-e 001 (Emitido) -> NF-e 123, 124
│
└── [CARGA 2: RETORNO] (Status: Pendente - Adicionada agora!)
    └── [BOTÃO: EMITIR CT-e] (Aguardando ação do usuário)
        └── DF-es (NF-es de Farinha já vinculadas)
```

## 5. Estrutura de Dados

### Tipos TypeScript Atualizados

#### Load (Carga)
```typescript
{
  id: string;
  status: 'Pending' | 'Scheduled' | 'Emitted' | 'Delivered';
  segment?: string; // Segmento operacional
  cte?: CTe; // CT-e atual vinculado
  // ... outros campos
}
```

#### Trip (Viagem)
```typescript
{
  id: string;
  status: 'Planned' | 'Picking Up' | 'In Transit' | 'Completed' | 'Delayed';
  segment?: string; // Segmento da viagem (determinado pela primeira carga)
  loads?: Load[]; // Cargas vinculadas
  // ... outros campos
}
```

#### Vehicle (Veículo)
```typescript
{
  id: string;
  type: 'Truck' | 'Carreta' | 'Bitrem' | 'Vuc';
  bodyType?: string; // Tipo de carroceria
  segment?: string; // Segmento operacional
  // ... outros campos
}
```

## 6. Componentes Principais

### ScheduleLoadModal
- **Função**: Modal para programar carga em veículo
- **Features**:
  - Filtro por segmento (match automático)
  - Mostra veículos compatíveis
  - Permite adicionar carga em veículo em movimento
  - Avisa sobre veículos incompatíveis

### LoadCardInTrip
- **Função**: Card de carga dentro da viagem
- **Features**:
  - Mostra status da carga
  - Botão "EMITIR CT-e" quando necessário
  - Informações do CT-e quando emitido
  - Expansível para mais detalhes

### TripBoardV2
- **Função**: Kanban board principal
- **Features**:
  - Colunas por status de viagem
  - Cards de viagem com informações consolidadas
  - Integração com sistema de segmentos

## 7. Benefícios do Fluxo

1. **Segurança Operacional**: Match de segmentos previne erros básicos
2. **Flexibilidade Fiscal**: CT-e por carga permite cancelamento sem perder a carga
3. **Maximização de Faturamento**: Adicionar carga de retorno aproveita caminhão em movimento
4. **Rastreabilidade**: Cada carga tem seu próprio ciclo de vida fiscal
5. **Controle Total**: Operador tem visibilidade completa do status de cada carga

## 8. Próximos Passos

- [ ] Integração com SEFAZ para emissão real de CT-e
- [ ] Geração automática de MDF-e quando múltiplos CT-es na mesma viagem
- [ ] Dashboard de métricas por segmento
- [ ] Notificações quando carga está aguardando CT-e há muito tempo
- [ ] Histórico de cancelamentos de CT-e por carga
