# Guia de Integração - Telas de Viagens (plug-and-play) no Projeto Oficial

Este guia fornece instruções (TL;DR) para integrar **as telas** deste protótipo no projeto oficial.

## Objetivo

- Este repositório é um **host de demo** (mock/SQLite) para evolução rápida do front.
- No projeto oficial, a intenção é “plugar” as telas e o backend real alimentar os dados.

## Contexto do projeto oficial (alvo)

- **Framework**: Next.js (React)
- **Backend**: rotas API do Next (`app/api/*` ou `pages/api/*`)
- **ORM**: Prisma
- **Deploy**: Railway (Next + Postgres)

O objetivo é manter o front **independente do backend** e com um **contrato estável** de dados/handlers.

## 🚀 Instalação Rápida

1.  **Copie os Arquivos**:
    - `modules/trips/` (screens + contrato de bootstrap)
    - `components/TripBoardV2.tsx` (Tela principal)
    - `components/TripDetails.tsx` (Detalhes / modal inline)
    - `components/TripTimeline.tsx` (Timeline - “2ª tela”)
    - `types.ts` (tipos de domínio)
2.  **Instale Dependências**:
    *   Certifique-se de ter `lucide-react` instalado:
        ```bash
        npm install lucide-react
        ```

## 🧩 Como usar (recomendado)

A recomendação é integrar via **screens** do módulo `modules/trips`, que já padronizam o contrato de props.

```tsx
import { TripShell, TripsAndLoadsScreen, TripTimelineScreen } from './modules/trips';
import { Trip, Load } from './types';

function MeuSistema() {
  // 1) Seus dados (vindos da API/Estado Global)
  const trips: Trip[] = [ ... ];
  const loads: Load[] = [ ... ];
  const vehicles = [ ... ];
  const clients = [{ name: 'Cliente A', address: '...' }];
  const cities = ['São Paulo, SP', 'Rio de Janeiro, RJ'];

  // 2) Renderização (opção A: usar uma "casca" com Sidebar e alternância)
  return (
    <TripShell
      trips={trips}
      loads={loads}
      vehicles={vehicles}
      availableDocs={[]}
      clients={clients}
      cities={cities}
      onCreateNew={() => {}}
      onCreateLoad={(data) => console.log('Criar Carga:', data)}
      onScheduleLoad={(load, vehicle, segment, customOrigin, controlNumber) => console.log('Agendar:', load, vehicle, segment, customOrigin, controlNumber)}
      onUpdateStatus={(id, status) => console.log('Status:', id, status)}
      onUpdateDeliveryStatus={(tripId, legId, deliveryId, status) => console.log('Delivery:', tripId, legId, deliveryId, status)}
      onAddLeg={(tripId, leg) => console.log('Nova Perna:', tripId, leg)}
      onAddDelivery={(tripId, legId, docs) => console.log('Nova Entrega:', tripId, legId, docs)}
      onAddDocument={(...params) => console.log('Novo Doc:', params)}
      onCreateTrip={(tripData) => console.log('Criar Viagem:', tripData)}
    />
  );
}
```

### Alternativa (opção B): integrar “tela a tela” no seu roteamento

- Use `TripsAndLoadsScreen` para a tela principal (kanban).
- Use `TripTimelineScreen` para a timeline.

## ✅ Requisitos específicos do Next.js

### 1) Marcar componentes como Client

Essas telas usam hooks (`useState`, `useEffect`). No **Next.js (App Router)**, garanta `"use client"` no topo de:

- `modules/trips/TripShell.tsx`
- `modules/trips/screens/TripsAndLoadsScreen.tsx`
- `modules/trips/screens/TripTimelineScreen.tsx`
- e também nos componentes que usam hooks: `components/TripBoardV2.tsx`, `components/TripDetails.tsx`, `components/Sidebar.tsx`, `components/TripTimeline.tsx`

> No host (Vite) isso não é exigido, mas no Next é.

### 2) Alias `@/` (imports)

Este protótipo usa imports do tipo `@/components/...` e `@/types`.

No projeto oficial (Next), configure `tsconfig.json` (ou `jsconfig.json`) para o alias apontar para `src/`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Se o seu projeto não usa `src/`, ajuste para a pasta raiz correta.

### 3) Estilos (Tailwind)

Este protótipo usa Tailwind via CDN no `index.html`. No Next, o ideal é Tailwind “de verdade” (build-time).
Se o projeto oficial já tem Tailwind, nada a fazer; se não tiver, configure Tailwind e mantenha as classes existentes.

## 🔌 Contrato de dados (o “plug” que o backend precisa fornecer)

As telas esperam que o backend forneça um bootstrap com este shape (ver `modules/trips/bootstrap.ts`):

- `GET /api/bootstrap` → `TripsBootstrapPayload`
  - `trips: Trip[]`
  - `loads: Load[]`
  - `vehicles: Vehicle[]`
  - `availableDocs: AvailableDocument[]`
  - `clients: { name: string; address: string }[]`
  - `cities: string[]`

Regra de ouro: **mantenha os campos em camelCase** no JSON (ex.: `createdAt`, `truckPlate`, `linkedCteNumber`).

## 🧱 Implementação no Next + Prisma (exemplo)

### App Router (`app/api/bootstrap/route.ts`)

Crie a rota:

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Exemplo de consultas (ajuste conforme seu schema Prisma)
  const [clients, cities, vehicles, loads, availableDocs, trips] = await Promise.all([
    prisma.client.findMany({ select: { name: true, address: true }, orderBy: { name: 'asc' } }),
    prisma.city.findMany({ select: { fullName: true }, orderBy: { fullName: 'asc' } }),
    prisma.vehicle.findMany({
      select: { id: true, plate: true, type: true, model: true, driverName: true, status: true },
      orderBy: { plate: 'asc' }
    }),
    prisma.load.findMany({
      select: {
        id: true,
        client: { select: { name: true } },
        originCity: true,
        destinationCity: true,
        collectionDate: true,
        status: true,
        vehicleTypeReq: true,
        observations: true
      },
      orderBy: [{ collectionDate: 'desc' }, { id: 'desc' }]
    }),
    prisma.availableDocument.findMany({
      select: {
        id: true,
        number: true,
        type: true,
        controlNumber: true,
        linkedCteNumber: true,
        value: true,
        weight: true,
        recipientName: true,
        destinationCity: true,
        destinationAddress: true,
        emissionDate: true
      },
      orderBy: [{ emissionDate: 'desc' }, { id: 'desc' }]
    }),
    prisma.trip.findMany({
      select: {
        id: true,
        createdAt: true,
        scheduledDate: true,
        estimatedReturnDate: true,
        status: true,
        driverName: true,
        truckPlate: true,
        trailer1Plate: true,
        trailer2Plate: true,
        trailer3Plate: true,
        mainDestination: true,
        originCity: true,
        freightValue: true,
        proofOfDelivery: true,
        legs: {
          orderBy: { sequence: 'asc' },
          select: {
            id: true,
            type: true,
            sequence: true,
            originCity: true,
            originAddress: true,
            destinationCity: true,
            hubName: true,
            controlNumber: true,
            segment: true,
            deliveries: {
              orderBy: { sequence: 'asc' },
              select: {
                id: true,
                sequence: true,
                destinationCity: true,
                destinationAddress: true,
                recipientName: true,
                status: true,
                proofOfDelivery: true,
                documents: {
                  orderBy: { id: 'asc' },
                  select: {
                    id: true,
                    number: true,
                    type: true,
                    controlNumber: true,
                    linkedCteNumber: true,
                    value: true,
                    weight: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return NextResponse.json({
    clients,
    cities: cities.map(c => c.fullName),
    vehicles,
    loads: loads.map(l => ({ ...l, clientName: l.client.name, client: undefined })),
    availableDocs,
    trips
  });
}
```

> Ajuste os nomes conforme seu schema Prisma. O importante é retornar o shape final esperado pelo front.

### Pages Router (`pages/api/bootstrap.ts`) (se o projeto usar)

Se o projeto oficial estiver no Pages Router, a ideia é a mesma: retornar o mesmo JSON, só muda o formato do handler.

## 🚄 Deploy no Railway (pontos de atenção)

- **Banco**: Postgres gerenciado pelo Railway (variável `DATABASE_URL`).
- **Prisma**:
  - rode `prisma migrate deploy` no pipeline/build (ou como comando de release no Railway).
  - garanta `DATABASE_URL` configurado.
- **CORS**: se o front e API estiverem no mesmo Next app, não precisa.

## 📋 Estrutura de Dados Importante

Para que o **Vínculo de CT-e** funcione no modal de detalhes, seus objetos de documento devem seguir esta estrutura (ver `types.ts`):

```typescript
interface Document {
  id: string;
  number: string;        // Ex: "NF-102030"
  type: 'NF' | 'CTe';
  controlNumber?: string;// Agrupador (Ex: "10293847")
  linkedCteNumber?: string; // IMPORTANTE: Se preenchido, aparece a tag "VINCULADO"
  // ...
}
```

## 🎨 Personalização

*   **Estilos**: O projeto usa Tailwind CSS padrão.
*   **Ícones**: Lucide React.
