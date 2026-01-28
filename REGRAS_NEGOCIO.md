# Regras de Negócio e Bloqueios

Este documento descreve as regras de negócio implementadas no sistema para evitar operações fisicamente ou fiscalmente impossíveis.

## Tipos de Validação

### Hard Blocks (Bloqueios Rígidos)
O sistema **impede** a ação. A operação não pode ser realizada até que o problema seja resolvido.

### Warnings (Alertas)
O sistema **avisa**, mas deixa o gerente decidir. A operação pode prosseguir após confirmação.

## 1. Bloqueios de Compatibilidade (Veículo x Carga)

### Regra do Segmento
**Tipo:** Hard Block

**Lógica:** O Segmento do Veículo deve ser compatível com o Segmento da Carga.

**Exemplo:**
- Carga de "TIJOLO" (exige carroceria aberta/sider)
- Veículo tipo "SILO" ou "BAÚ FRIGORÍFICO"
- **Resultado:** Bloqueio imediato

**Implementação:**
- Arquivo: `lib/validations.ts` → `validateSegmentCompatibility()`
- Usa: `config/segmentos.ts` para verificar compatibilidade

### Regra de Veículo Dedicado
**Tipo:** Hard Block

**Lógica:** Se a Carga está marcada como "Exclusiva" ou "Lotação", o sistema impede a adição de qualquer outra carga na mesma viagem.

**Implementação:**
- Arquivo: `lib/validations.ts` → `validateDedicatedVehicle()`
- Verifica campo `requirements` da carga

## 2. Bloqueios de Capacidade (Peso e Volume)

### Validação Física Absoluta
**Tipo:** Hard Block

**Lógica:** O Peso da Carga nunca pode ser maior que a Capacidade Total do Veículo.

**Exemplo:**
- Carga: 38t
- Veículo: 37t de capacidade
- **Resultado:** Bloqueio imediato

**Implementação:**
- Arquivo: `lib/validations.ts` → `validateCapacity()`
- Valida peso e volume separadamente

### Gestão de Saldo (Carga de Retorno)
**Tipo:** Warning

**Lógica:** Para cargas de retorno, o sistema assume que a primeira carga será entregue antes da coleta da segunda.

**Exemplo:**
- Caminhão: 37t capacidade
- Ida: 37t (cheio)
- Retorno: 30t
- **Resultado:** Permite (assume que descarregou antes de carregar retorno)

**Implementação:**
- Arquivo: `lib/validations.ts` → `validateCapacity()` com `loadType: 'RETORNO'`
- Arquivo: `lib/validations.ts` → `validateReturnSequence()` para validar datas

## 3. Regras Fiscais (CT-e e MDF-e)

### Bloqueio de Emissão Sem Motorista
**Tipo:** Hard Block

**Lógica:** O botão "Emitir CT-e" fica desabilitado enquanto a Carga não estiver vinculada a uma Viagem com Motorista e Placa confirmados.

**Implementação:**
- Arquivo: `lib/validations.ts` → `validateCTeEmission()`
- Componente: `components/LoadCardInTrip.tsx` → Botão desabilitado com mensagem

### Trava de Alteração Pós-Emissão
**Tipo:** Hard Block

**Lógica:** Se o CT-e já foi autorizado pela SEFAZ, o sistema bloqueia a troca de Motorista ou Veículo naquela Viagem.

**Solução:** Para trocar, o usuário deve cancelar o CT-e primeiro ou emitir evento de encerramento.

**Implementação:**
- Arquivo: `lib/validations.ts` → `validatePostEmissionChange()`
- Verifica se há CT-e autorizado antes de permitir alterações

### Bloqueio de MDF-e Aberto
**Tipo:** Hard Block (a implementar)

**Lógica:** Não permite "Iniciar Viagem" se o mesmo veículo/motorista já possui um MDF-e não encerrado.

**Status:** Placeholder implementado, aguardando integração com SEFAZ.

**Implementação:**
- Arquivo: `lib/validations.ts` → `validateOpenMDFe()`
- TODO: Implementar verificação real no banco/API

## 4. Regras Operacionais de Status

### Regra de "Viagem Finalizada"
**Tipo:** Hard Block

**Lógica:** Não é possível adicionar novas cargas a uma viagem com status `Completed` ou `Cancelled`.

**Implementação:**
- Arquivo: `lib/validations.ts` → `validateTripStatus()`
- Bloqueia adição de cargas em viagens concluídas

### Regra de Consistência de Datas
**Tipo:** Warning

**Lógica:** Se a Data de Coleta da Carga de Retorno for anterior à Previsão de Entrega da Carga de Ida, o sistema emite alerta.

**Implementação:**
- Arquivo: `lib/validations.ts` → `validateReturnSequence()`
- Compara datas e mostra warning se incompatível

## Funções Principais

### `validateAddLoadToTrip()`
Validação completa para adicionar carga a uma viagem.

**Validações incluídas:**
1. Status da viagem
2. Compatibilidade de segmento
3. Veículo dedicado
4. Capacidade (peso e volume)
5. Sequência logística (retorno)

**Retorna:**
```typescript
{
  valid: boolean;
  errors: string[];      // Hard blocks
  warnings: string[];    // Alertas
}
```

### `validateEmitCTe()`
Validação para emitir CT-e.

**Validações incluídas:**
1. Viagem vinculada
2. Motorista confirmado
3. Placa confirmada
4. Carga não possui CT-e já autorizado
5. Carga está agendada

## Integração nos Componentes

### ScheduleLoadModal
- Valida compatibilidade de segmento antes de permitir seleção
- Mostra erro visual se validação falhar
- Valida completamente se adicionando a viagem existente

### LoadCardInTrip
- Botão "EMITIR CT-e" desabilitado se validação falhar
- Mostra mensagem de erro no lugar do botão

### App.tsx
- `handleScheduleLoad()`: Valida segmento antes de criar viagem
- `handleAttachLoadsToTrip()`: Valida completamente antes de adicionar cargas
- `handleEmitCTe()`: Valida antes de emitir CT-e mock

## Exemplos de Uso

### Exemplo 1: Bloqueio de Segmento
```
Usuário tenta agendar carga de "TIJOLO" em veículo "SILO"
→ Sistema bloqueia: "Veículo incompatível! Carga de 'TIJOLO' requer: Sider, Prancha, Basculante"
```

### Exemplo 2: Bloqueio de Capacidade
```
Usuário tenta adicionar carga de 40t em veículo de 37t
→ Sistema bloqueia: "Peso da carga (40000kg) excede a capacidade disponível (37000kg)"
```

### Exemplo 3: Warning de Data
```
Usuário adiciona carga de retorno com coleta anterior à entrega da ida
→ Sistema avisa: "Atenção: Data de coleta do retorno é anterior à previsão de entrega da ida"
→ Usuário pode confirmar ou cancelar
```

### Exemplo 4: Bloqueio de CT-e
```
Usuário tenta emitir CT-e sem motorista na viagem
→ Botão desabilitado: "CT-e requer motorista confirmado na viagem"
```

## Próximos Passos

- [ ] Implementar validação real de MDF-e aberto (requer integração SEFAZ)
- [ ] Adicionar validação de capacidade por tipo de carroceria
- [ ] Implementar validação de rota (distância máxima, tempo de viagem)
- [ ] Adicionar validação de documentos obrigatórios por segmento
- [ ] Implementar histórico de bloqueios para auditoria
