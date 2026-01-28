# Plugin - Trips (Torre de Controle)

Este diretório existe para deixar a integração **plug-and-play** no projeto oficial.

## O que importar

Use sempre o entrypoint:

- `plugin/trips`

Ele reexporta:
- `TripShell`, `TripsAndLoadsScreen`, `TripTimelineScreen`
- tipos de domínio (`Trip`, `Load`, etc.)
- contrato de bootstrap (`TripsBootstrapPayload`, `fetchTripsBootstrap`, `getMockTripsBootstrap`)

## Notas importantes

- **Timeline / Cronograma**: no protótipo a tela tenta `GET /api/cronograma` (relativo ao host).  
  No projeto oficial, prefira injetar os dados via `scheduleItems` ou `loadScheduleItems`.
- **Next.js**: lembre de adicionar `"use client"` nas telas/componentes que usam hooks (veja `INTEGRATION_GUIDE.md`).

