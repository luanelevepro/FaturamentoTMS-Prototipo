# Análise do Projeto: Esteira Contábil Frontend

## Visão Geral

O **Esteira Contábil Frontend** é uma aplicação Next.js 15 (React 19) desenvolvida para gestão contábil e fiscal, com módulos específicos para transporte e faturamento. O projeto utiliza TypeScript, Tailwind CSS, Radix UI e Supabase para autenticação.

## Stack Tecnológica

### Core
- **Framework**: Next.js 15.5.9
- **React**: 19.0.0
- **TypeScript**: 5.7.2
- **Gerenciador**: pnpm 9.15.0

### UI/UX
- **Tailwind CSS**: 4.1.5
- **Radix UI**: Componentes acessíveis (Dialog, Dropdown, Select, etc.)
- **Framer Motion**: 12.23.25 (animações)
- **Lucide React**: Ícones
- **Recharts**: Gráficos e visualizações

### Estado e Dados
- **TanStack Query (React Query)**: 5.62.16 (gerenciamento de estado servidor)
- **TanStack Table**: 8.20.6 (tabelas avançadas)
- **Supabase**: Autenticação e backend

### Funcionalidades
- **DnD Kit**: Drag and drop (@dnd-kit/core, @dnd-kit/sortable)
- **Date-fns**: Manipulação de datas
- **Sonner**: Notificações toast

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── general/        # Componentes específicos de domínio
│   ├── layout/         # Layouts (Dashboard, System, Page)
│   ├── navigation/     # Navegação (Sidebar, Header)
│   ├── ui/             # Componentes base (shadcn/ui)
│   └── viewers/        # Visualizadores de documentos fiscais
├── context/            # Contextos React (Company, Layout, Theme)
├── hooks/              # Custom hooks
├── interfaces/         # Definições TypeScript
│   └── faturamento/
│       └── transporte/ # Interfaces de CT-e, DFe, Email
├── pages/              # Páginas Next.js (rotas)
│   ├── faturamento/
│   │   ├── transporte/ # Módulo de transporte
│   │   └── veiculos/   # Gestão de veículos
│   ├── tms/            # TMS (Transportation Management System)
│   └── fiscal/        # Módulo fiscal
├── services/           # Serviços de API
│   └── api/
│       ├── transporte.tsx
│       └── tms.tsx
├── types/              # Tipos globais TypeScript
├── utils/              # Utilitários
└── styles/             # Estilos globais
```

## Módulos Principais

### 1. Módulo Fiscal
**Localização**: `src/pages/fiscal/`

- **Entradas**: Gestão de NF-es de entrada
- **Saídas**: Gestão de NF-es de saída
- **Auditoria**: Auditoria fiscal
- **Certificado Digital**: Gestão de certificados
- **Fornecedores**: Cadastro de fornecedores
- **Produtos**: Cadastro de produtos
- **Serviços**: Gestão de serviços

### 2. Módulo de Transporte (Faturamento)
**Localização**: `src/pages/faturamento/transporte/`

#### Páginas:
- **`index.tsx`**: Dashboard de viagens e cargas
- **`cte/index.tsx`**: Gestão de CT-es
- **`dfe/index.tsx`**: Gestão de DF-es (Documentos Fiscais Eletrônicos)
- **`mdfe/index.tsx`**: Gestão de MDF-es
- **`viagens-cargas/index.tsx`**: Gestão de viagens e cargas

#### Estrutura de Dados:

**Viagem (`ObjCte`)**:
```typescript
{
  id: string;
  idViagem: string;
  time: Date;
  cavalo: string;        // Placa do cavalo
  carreta?: string[];     // Placas das carretas
  motorista: string;
  valorTotal: number;
  valorFrete: number;
  status: 'transit' | 'successTwo' | 'late';
  detalhes: ObjTravel[]; // Detalhes da viagem
  costDetails: {          // Detalhes de custos
    combustivel: number;
    pedagio: number;
    outrasDepesas: number;
    custosPessoal: number;
    custosTotal: number;
    margemLucro: number;
    faturamento: number;
  }
}
```

**Detalhes da Viagem (`ObjTravel`)**:
```typescript
{
  id: string;
  origem: {
    cidade: string;
    endereco: string;
    ct: string;           // Centro de distribuição
  };
  destino: {
    id: string;
    cidade: string;
    end: string;
    destino: string;
    docs?: { id: string; doc: string }[];
    status: Status;
  }[];
}
```

### 3. Módulo TMS (Transportation Management System)
**Localização**: `src/pages/tms/`

#### Páginas:
- **`veiculos/index.tsx`**: Gestão de veículos
- **`segmentos/index.tsx`**: Gestão de segmentos operacionais

#### Estrutura de Dados:

**Veículo (`VeiculosData`)**:
```typescript
{
  id: string;
  ds_placa: string;
  ds_nome: string;
  vl_aquisicao: number | null;
  is_ativo: boolean;
  is_carroceria: boolean;      // É carroceria?
  is_tracionador: boolean;     // É tracionador?
  dt_aquisicao: string | null;
  dt_baixa: string | null;
  id_centro_custos: string | null;
  js_con_centro_custos?: {
    id: string;
    ds_nome_ccusto: string;
  };
}
```

**Segmento (`SegmentoData`)**:
```typescript
{
  id: string;
  cd_identificador: string;    // Código identificador
  ds_nome: string;             // Nome do segmento
  is_ativo: boolean;
  dt_created: string;
  dt_updated: string;
  id_tms_empresas: string;
}
```

### 4. Módulo de Veículos (Faturamento)
**Localização**: `src/pages/faturamento/veiculos/`

- Gestão completa de veículos
- Formulários para:
  - Propriedade
  - Conjuntos (Joints)
  - Complementares
  - Eventos
  - Histórico
  - Mapa de Pneus

## APIs e Serviços

### Transporte (`services/api/transporte.tsx`)
- `getDfes()`: Buscar DF-es com filtros
- `patchDfe()`: Atualizar número de controle do DFe
- `getDfeStatics()`: Estatísticas de DF-es
- `postCte()`: Criar/enviar CT-e
- `getCtes()`: Buscar CT-es
- `getCFOPCte()`: Buscar CFOPs para CT-e
- `getEmails()`: Buscar emails por usuário

### TMS (`services/api/tms.tsx`)

#### Veículos:
- `getVeiculos()`: Listar veículos
- `getVeiculosPaginado()`: Listar com paginação
- `sincronizarVeiculos()`: Sincronizar veículos de empresa externa
- `updateVeiculo()`: Atualizar veículo
- `ativarVeiculos()`: Ativar múltiplos veículos
- `inativarVeiculos()`: Inativar múltiplos veículos
- `setCarroceria()`: Definir como carroceria
- `setTracionador()`: Definir como tracionador

#### Segmentos:
- `getSegmentos()`: Listar segmentos
- `getSegmentosPaginado()`: Listar com paginação
- `createSegmento()`: Criar segmento
- `updateSegmento()`: Atualizar segmento
- `deleteSegmento()`: Deletar segmento
- `ativarSegmentos()`: Ativar múltiplos segmentos
- `inativarSegmentos()`: Inativar múltiplos segmentos

## Interfaces TypeScript

### CT-e (`interfaces/faturamento/transporte/cte.ts`)
```typescript
interface ICreateCte {
  id_empresa?: string;
  nfe_ids?: string[];
  dados_adicionais: {
    serie?: string;
    modal?: string;
    tpServ?: string;
    RNTRC?: string;
    dPrev?: string;
    cfop?: string;
    valorFrete?: string;
    pesoTotal?: number;
    pagamento?: string;
  };
}
```

### DFe (`interfaces/faturamento/transporte/dfe.ts`)
```typescript
interface IDFe {
  id: string;
  ds_controle: number;
  ds_tipo: string;
  ds_status?: 'PENDENTE' | 'VINCULADO' | 'PROCESSADO' | 'CANCELADO';
  dt_emissao: string;
  valorTotal: number;
  vFrete: number;
  vCarga: number;
  xMunIni: string;
  xMunFim: string;
  js_nfe: INfeJs;
  is_subcontratada: boolean;
  // ... outros campos
}
```

## Componentes Principais

### Viewers de Documentos Fiscais
- **`viewer-cte.tsx`**: Visualizador de CT-e
- **`viewer-nfe.tsx`**: Visualizador de NF-e
- **`viewer-nfse.tsx`**: Visualizador de NFSe

### Componentes de Transporte
- **`CardsTransporte.tsx`**: Cards de dashboard de transporte
- **`AddTravel.tsx`**: Adicionar viagem
- **`AddPercurso.tsx`**: Adicionar percurso

### Componentes TMS
- **`btn-sync-data.tsx`**: Botão de sincronização de dados

## Padrões e Convenções

### Nomenclatura
- **Páginas**: `index.tsx` dentro de pastas
- **Componentes**: PascalCase (`CardsTransporte.tsx`)
- **Serviços**: camelCase (`getVeiculos.tsx`)
- **Interfaces**: Prefixo `I` (`IDFe`, `ICte`)

### Estado
- **React Query**: Para dados do servidor
- **Context API**: Para estado global (Company, Layout, Theme)
- **useState**: Para estado local de componentes

### Roteamento
- Next.js Pages Router (não App Router)
- Rotas baseadas em estrutura de pastas

## Comparação com o Projeto Atual (FaturamentoTMS-Prototipo)

### Semelhanças
1. **Módulo de Transporte**: Ambos têm gestão de viagens e cargas
2. **Segmentos**: Ambos trabalham com segmentos operacionais
3. **CT-e**: Ambos lidam com emissão e gestão de CT-es
4. **Veículos**: Ambos têm gestão de veículos

### Diferenças

| Aspecto | Esteira Contábil | FaturamentoTMS-Prototipo |
|---------|------------------|--------------------------|
| **Framework** | Next.js 15 (Pages Router) | React + Vite |
| **UI Library** | Radix UI + shadcn/ui | Tailwind CSS customizado |
| **Estado** | React Query + Context | useState/useReducer |
| **Backend** | Supabase + API REST | SQLite local + Express |
| **Estrutura** | Módulos separados (Fiscal, TMS, Faturamento) | Focado em TMS/Transporte |
| **Segmentos** | CRUD completo com API | Configuração estática (`config/segmentos.ts`) |
| **Veículos** | Integração com sistema externo (sync) | Mock/local |
| **CT-e** | Integração real com SEFAZ | Simulação visual |

### Oportunidades de Integração

1. **Sistema de Segmentos**:
   - Esteira tem CRUD completo via API
   - Protótipo tem configuração estática
   - **Sugestão**: Migrar para API quando disponível

2. **Gestão de Veículos**:
   - Esteira tem sincronização com sistema externo
   - Protótipo trabalha com dados locais
   - **Sugestão**: Implementar sync quando backend estiver pronto

3. **Visualização de CT-e**:
   - Esteira tem viewer completo de CT-e
   - Protótipo mostra apenas informações básicas
   - **Sugestão**: Reutilizar componente de viewer

4. **Estrutura de Viagens**:
   - Esteira tem estrutura mais detalhada (custos, margem)
   - Protótipo foca em fluxo operacional
   - **Sugestão**: Combinar ambos (fluxo + detalhes financeiros)

## Pontos Fortes do Esteira Contábil

1. **Arquitetura Modular**: Separação clara entre módulos
2. **TypeScript Robusto**: Tipos bem definidos
3. **UI Componentizada**: shadcn/ui bem estruturado
4. **Integração Real**: APIs funcionais com backend
5. **Gestão de Estado**: React Query bem implementado
6. **Acessibilidade**: Radix UI garante acessibilidade

## Pontos de Atenção

1. **Complexidade**: Projeto grande com muitos módulos
2. **Dependências**: Muitas dependências (pode ser difícil manter)
3. **Next.js Pages Router**: Considerar migração para App Router no futuro
4. **Tipos Globais**: Namespace `ESTEIRA.RAW` pode ser confuso

## Recomendações para o Protótipo Atual

1. **Adotar React Query**: Para melhor gestão de estado servidor
2. **Componentizar Mais**: Separar componentes grandes em menores
3. **Tipos Mais Robustos**: Criar namespaces como no Esteira
4. **Viewer de CT-e**: Implementar visualização completa de CT-e
5. **Estrutura de Custos**: Adicionar detalhamento de custos nas viagens
6. **Sincronização**: Preparar estrutura para sync quando backend estiver pronto

## Conclusão

O **Esteira Contábil Frontend** é um projeto maduro e bem estruturado, com foco em gestão fiscal e contábil, incluindo módulo de transporte. Serve como excelente referência para:

- Arquitetura de componentes
- Gestão de estado com React Query
- Integração com APIs
- Estruturação de tipos TypeScript
- Padrões de UI/UX

O projeto atual (FaturamentoTMS-Prototipo) pode se beneficiar especialmente das estruturas de dados e padrões de API do Esteira, especialmente na parte de transporte e TMS.
