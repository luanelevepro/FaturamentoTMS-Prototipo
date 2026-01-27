# Changelog - Torre de Controle de Cargas

**Data:** 26/01/2026  
**Versão:** 2.0.0  
**Módulo:** Tela de Cargas (LoadBoard)

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Alterações nos Tipos](#alterações-nos-tipos)
3. [Sistema de Urgência e Alertas](#sistema-de-urgência-e-alertas)
4. [Componentes Modificados](#componentes-modificados)
5. [Dados de Mock](#dados-de-mock)
6. [Guia de Uso](#guia-de-uso)

---

## Visão Geral

Esta atualização transforma a tela de Cargas em uma verdadeira **Torre de Controle**, permitindo que o gestor:

- **Antecipe gargalos** através de indicadores visuais de urgência
- **Filtre cargas** por região, segmento, urgência e tipo de veículo
- **Visualize alertas** em um painel centralizado
- **Cadastre cargas completas** com características físicas, SLA e requisitos

### Princípios de Design

| Princípio | Implementação |
|-----------|---------------|
| Reduzir carga cognitiva | Cores semânticas padronizadas |
| Antecipar problemas | Alertas automáticos por SLA |
| Facilitar triagem | Filtros inteligentes + ordenação |
| Visibilidade completa | Cards com informações essenciais |

---

## Alterações nos Tipos

### Interface `Load` (types.ts)

```typescript
interface Load {
  // Campos existentes
  id: string;
  clientName: string;
  originCity: string;
  destinationCity?: string;
  collectionDate: string;
  status: 'Pending' | 'Scheduled';
  documents?: AvailableDocument[];
  requirements?: string[];
  vehicleTypeReq?: string;
  observations?: string;
  
  // ===== NOVOS CAMPOS =====
  
  // Características Físicas
  weight?: number;                // Peso bruto em kg
  netWeight?: number;             // Peso líquido em kg
  volume?: number;                // Cubagem em m³
  packages?: number;              // Quantidade de volumes/caixas
  maxStacking?: number;           // Limite de empilhamento (ex: 3x)
  
  // Janelas de Tempo (SLA)
  collectionWindowStart?: string; // ISO datetime - início da janela de coleta
  collectionWindowEnd?: string;   // ISO datetime - fim da janela de coleta
  deliveryDeadline?: string;      // ISO datetime - PRAZO LIMITE de entrega
  
  // Financeiro & Risco
  merchandiseValue?: number;      // Valor da mercadoria em R$
  insuranceRequired?: boolean;    // Se requer seguro (RCTR-C / RCF-DC)
  
  // Classificação
  priority?: 'low' | 'normal' | 'high' | 'urgent';  // Prioridade manual
  segment?: string;               // Segmento de mercado
}
```

### Interface `Vehicle` (types.ts)

```typescript
interface Vehicle {
  // Campos existentes
  id: string;
  plate: string;
  type: 'Truck' | 'Carreta' | 'Bitrem' | 'Vuc';
  model: string;
  driverName?: string;
  status: 'Available' | 'In Use' | 'Maintenance';
  
  // ===== NOVOS CAMPOS =====
  
  driverPhone?: string;           // Telefone do motorista
  capacity?: number;              // Capacidade de carga em kg
  volumeCapacity?: number;        // Capacidade de volume em m³
  lastMaintenance?: string;       // Data da última manutenção
  nextMaintenance?: string;       // Data da próxima manutenção
}
```

---

## Sistema de Urgência e Alertas

### Níveis de Urgência

O sistema calcula automaticamente a urgência baseado no **tempo restante até o `deliveryDeadline`**:

| Nível | Cor | Condição | Ação Esperada |
|-------|-----|----------|---------------|
| **CRÍTICO** | 🔴 Vermelho | `< 12 horas` OU `priority === 'urgent'` | Ação imediata necessária |
| **ALERTA** | 🟠 Laranja | `< 24 horas` | Atenção redobrada, priorizar |
| **ATENÇÃO** | 🟡 Amarelo | `< 48 horas` | Monitorar, planejar alocação |
| **NORMAL** | ⚪ Cinza | `>= 48 horas` | Fluxo normal |

### Algoritmo de Cálculo

```typescript
const getUrgencyLevel = (load: Load): 'critical' | 'warning' | 'attention' | 'normal' => {
    // 1. Prioridade explícita tem precedência
    if (load.priority === 'urgent') return 'critical';
    
    // 2. Calcular horas até o deadline
    const hours = getHoursUntilDeadline(load.deliveryDeadline);
    
    // 3. Se não há deadline, é normal
    if (hours === null) return 'normal';
    
    // 4. Classificar por tempo restante
    if (hours <= 12) return 'critical';      // Menos de 12h
    if (hours <= 24) return 'warning';       // Menos de 24h
    if (hours <= 48) return 'attention';     // Menos de 48h
    return 'normal';                          // Mais de 48h
};
```

### Indicadores Visuais

#### Cards no Board

| Urgência | Visual do Card |
|----------|----------------|
| Crítico | Borda vermelha com `ring-2`, badge "URGENTE" pulsando |
| Alerta | Borda laranja com `ring-1`, badge "ALERTA" |
| Atenção | Borda amarela, badge "ATENÇÃO" |
| Normal | Borda cinza padrão |

#### Painel de Alertas

O painel lateral agrupa cargas por nível de urgência:

```
┌─────────────────────────────┐
│ 🔔 Central de Alertas       │
├─────────────────────────────┤
│ 🔴 Crítico (2)              │
│   ├── Amazon → RJ (4h)      │
│   └── Ambev → PR (10h)      │
├─────────────────────────────┤
│ 🟠 Alerta (1)               │
│   └── Unilever → MG (18h)   │
├─────────────────────────────┤
│ 🟡 Atenção (2)              │
│   ├── Pepsico → SC (36h)    │
│   └── Nestlé → SP (42h)     │
├─────────────────────────────┤
│ Resumo do Backlog           │
│ Total: 6 | Urgentes: 3      │
│ Peso Total: 104.3t          │
└─────────────────────────────┘
```

---

## Componentes Modificados

### 1. LoadBoard.tsx

**Localização:** `components/LoadBoard.tsx`

#### Novas Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| `FiltersBar` | Barra de filtros por urgência, destino, segmento e tipo de veículo |
| `AlertsPanel` | Painel lateral com cargas agrupadas por urgência |
| `UrgencyBadge` | Badge colorido com ícone e animação |
| `VehicleCard` | Card de veículo com capacidades e alerta de manutenção |
| Ordenação automática | Cargas mais urgentes aparecem primeiro na coluna |

#### Props do LoadCard

```typescript
interface LoadCardProps {
  load: Load;
  status: string;
  tripContext?: Trip;
  onClick: () => void;
  progress?: number;  // Barra de progresso (0-100)
}
```

#### Informações Exibidas no Card

```
┌─────────────────────────────────┐
│ #CRG-001        🔴 URGENTE      │  ← ID + Badge de urgência
├─────────────────────────────────┤
│ [A] AMAZON LOGÍSTICA            │  ← Cliente com avatar
│     📦 E-commerce               │  ← Segmento
├─────────────────────────────────┤
│ ○ São Paulo, SP                 │  ← Origem
│ → RIO DE JANEIRO, RJ            │  ← Destino
├─────────────────────────────────┤
│ ┌─────┬─────┬─────┐             │
│ │Peso │Vol  │Vols │             │  ← Características físicas
│ │8.2t │62m³ │1240 │             │
│ └─────┴─────┴─────┘             │
├─────────────────────────────────┤
│ ⏱ Prazo Entrega      4h        │  ← Countdown do SLA
├─────────────────────────────────┤
│ 🛡 Seguro  💰 Alto Valor        │  ← Tags especiais
│ 🚛 Carreta                      │
├─────────────────────────────────┤
│ 📅 26/01/2026 | ⏰ 06:00        │  ← Data/hora coleta
├─────────────────────────────────┤
│ [    PROGRAMAR VEÍCULO    ]     │  ← CTA (se pendente)
└─────────────────────────────────┘
```

---

### 2. LoadDetailsModal.tsx

**Localização:** `components/LoadDetailsModal.tsx`

#### Seções do Modal

| Seção | Conteúdo |
|-------|----------|
| **Header** | Status, prioridade, segmento, ID |
| **Banner SLA** | Indicador visual do prazo com countdown |
| **Rota** | Origem → Destino em timeline visual |
| **Janelas de Tempo** | Coleta (com horário) + Entrega (SLA) |
| **Características Físicas** | Peso, cubagem, volumes, empilhamento |
| **Informações Financeiras** | Valor da mercadoria, seguro |
| **Especificações de Veículo** | Tipo exigido + requisitos especiais |
| **Footer** | Densidade calculada + botão de ação |

#### Cores do Banner SLA

```typescript
const urgencyConfig = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', label: 'CRÍTICO' },
  warning:  { bg: 'bg-orange-50', text: 'text-orange-700', label: 'ALERTA' },
  attention:{ bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'ATENÇÃO' },
  normal:   { bg: 'bg-green-50', text: 'text-green-700', label: 'NO PRAZO' }
};
```

---

### 3. CreateLoadModal.tsx

**Localização:** `components/CreateLoadModal.tsx`

#### Sistema de Abas

| Aba | Campos |
|-----|--------|
| **Dados Básicos** | Cliente, segmento, origem, destino, tipo veículo, veículo para agendamento, observações |
| **Características** | Peso, cubagem, volumes, empilhamento máx., valor da mercadoria, seguro obrigatório |
| **SLA / Prazos** | Prioridade (4 níveis), data coleta, janela coleta (início/fim), prazo entrega |
| **Requisitos** | 12 opções de requisitos especiais (checkbox) |

#### Opções de Prioridade

```typescript
const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Baixa',   color: 'blue' },
  { value: 'normal', label: 'Normal',  color: 'gray' },
  { value: 'high',   label: 'Alta',    color: 'orange' },
  { value: 'urgent', label: 'Urgente', color: 'red' }
];
```

#### Opções de Segmento

```typescript
const SEGMENT_OPTIONS = [
  'Industrial', 'E-commerce', 'Alimentos', 'Bebidas', 
  'Agro', 'Farmacêutico', 'Químico', 'Automotivo', 'Varejo', 'Outro'
];
```

#### Requisitos Disponíveis

```typescript
const REQUIREMENTS_OPTIONS = [
  'EPI Básico (Capacete/Bota)', 'EPI Completo (Óculos/Luva)',
  'Ajudante Extra', 'Paletes Vazios',
  'Corda / Cinta de Amarração', 'Lona de Proteção',
  'Manuseio Frágil', 'Rastreamento em Tempo Real',
  'Conferência Cega', 'Escolta', 'Baú Seco', 'Sider'
];
```

---

### 4. BoardUI.tsx

**Localização:** `components/BoardUI.tsx`

#### Alterações

| Componente | Alteração |
|------------|-----------|
| `BoardColumn` | Novo prop `headerExtra` para elementos extras no header (ex: botão de alertas) |
| `EmptyState` | Aceita `message` além de `text` |

---

## Dados de Mock

### Cargas de Exemplo (mocks.ts)

| ID | Cliente | Rota | Prazo | Urgência |
|----|---------|------|-------|----------|
| load-1 | Pepsico | POA → Floripa | 28/01 18h | Normal |
| load-2 | Amazon | SP → RJ | **26/01 23h59** | 🔴 Crítico |
| load-3 | Nestlé | Campinas → Santos | 29/01 12h | Normal |
| load-4 | Ambev | Jaguariúna → Curitiba | **27/01 08h** | 🟠 Alerta |
| load-5 | Cargill | Uberlândia → Paranaguá | 31/01 18h | Baixa |
| load-6 | Unilever | SP → BH | **27/01 12h** | 🟡 Atenção |

### Veículos de Exemplo (mocks.ts)

| Placa | Tipo | Capacidade | Motorista | Status |
|-------|------|------------|-----------|--------|
| BIT-1234 | Bitrem | 37t / 90m³ | João da Silva | Disponível |
| CAR-4234 | Carreta | 25t / 75m³ | Marcos Oliveira | Em Uso |
| TRK-5678 | Truck | 14t / 45m³ | Lucas Pereira | Disponível |
| CAR-9876 | Carreta | 25t / 75m³ | Roberto Xtutz | Em Uso |
| BIT-2468 | Bitrem | 37t / 90m³ | Carlos Santos | Disponível |
| VUC-1357 | VUC | 3.5t / 18m³ | Pedro Almeida | Manutenção |

---

## Guia de Uso

### Fluxo de Trabalho Recomendado

```
1. Abrir a tela de Cargas
   └── Header → Botão "Cargas"

2. Verificar alertas
   └── Clicar no 🔔 na coluna "Backlog de Cargas"
   └── Analisar cargas críticas e em alerta

3. Filtrar se necessário
   └── Por urgência: focar em críticos primeiro
   └── Por destino: agrupar por região
   └── Por segmento: priorizar tipos específicos

4. Alocar veículos
   └── Clicar no card da carga
   └── Analisar detalhes no modal
   └── Clicar "Programar Veículo"

5. Acompanhar execução
   └── Cargas movem pelas colunas:
       Backlog → Agendadas → Em Coleta → Em Rota → Entregues
```

### Boas Práticas

| Situação | Ação Recomendada |
|----------|------------------|
| Carga crítica aparece | Alocar veículo disponível imediatamente |
| Muitas cargas em alerta | Filtrar por destino e consolidar |
| Veículo em manutenção | Verificar data de retorno antes de prometer SLA |
| Carga de alto valor | Verificar se seguro está configurado |
| Cliente exige horário específico | Usar janela de coleta precisa |

---

## Arquivos Modificados

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `types.ts` | Novos campos em Load e Vehicle |
| `mocks.ts` | Dados enriquecidos para teste |
| `components/LoadBoard.tsx` | Reescrito com novas funcionalidades |
| `components/LoadDetailsModal.tsx` | Reescrito com novas seções |
| `components/CreateLoadModal.tsx` | Reescrito com sistema de abas |
| `components/BoardUI.tsx` | Novos props |

---

## Próximas Evoluções Sugeridas

1. **Validação de Capacidade**: Alertar se peso > capacidade do veículo
2. **Mapa Integrado**: Visualizar dispersão de cargas por região
3. **Notificações Push**: Alertar em tempo real sobre cargas críticas
4. **Dashboard de KPIs**: OTD, ocupação média, custo por km
5. **Integração GPS**: ETA dinâmico baseado em posição real

---

*Documentação gerada em 26/01/2026*
