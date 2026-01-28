# Definições do Projeto

Este documento define os principais conceitos e estados utilizados na Torre de Controle do sistema.

## Glossário de Termos

## Hierarquia Operacional x Fiscal (Modelo Alvo)

Nesta solução, a “Torre de Controle” precisa ser coerente com a hierarquia fiscal brasileira (SEFAZ) e com o planejamento operacional:

1. **Viagem (`Trip`) — o “envelope” operacional**
   - Agrupa tudo que um veículo e motorista fazem do início ao fim.
   - Pode conter múltiplas Cargas (pernas/serviços) e deslocamentos vazios.

2. **Carga (`Leg` com `type='LOAD'`) — a unidade operacional do trecho**
   - Representa **um serviço de transporte** que será faturado.
   - Regra geral fiscal: **uma Carga (serviço) = um destino fiscal = um CT-e**.
   - Uma Viagem pode ter várias Cargas (multi-stop) e isso aparece como múltiplas `Legs`.

3. **Entrega (`Delivery`) — a parada/ponto de descarga**
   - Representa o ponto operacional onde ocorre entrega/descarga.
   - No modelo alvo, cada `Leg (LOAD)` deve ter **1 entrega principal**, para manter coerência com “CT-e por destino”.

4. **CT-e (`Document` com `type='CTe'`) — documento fiscal do transporte**
   - Legaliza a prestação do serviço daquela Carga.
   - Pode ser **próprio** ou **subcontratado** (redespacho/subcontratação).

5. **NF-e / DF-e (`Document` com `type='NF'`) — documentos da mercadoria**
   - Notas consolidadas no CT-e.
   - A seleção “Top-Down” (CT-e → NF-es) deve operar em cascata:
     - selecionar um CT-e implica selecionar/bloquear as NF-es vinculadas para evitar duplo embarque.

### Regras-Chave

- **CT-e por destino (regra geral)**: cada destinatário fiscal (CNPJ/CPF distinto) exige CT-e próprio.
- **Multi-stop**: múltiplos destinos dentro da mesma viagem ⇒ múltiplas Cargas (`Legs`) na mesma Viagem.
- **Ida/Retorno (gerencial)**:
  - Cada `Leg (LOAD)` pode ser marcada como `direction: 'Ida' | 'Retorno'`.
  - A visão gerencial deve exibir a contagem de Cargas de **Ida** e **Retorno** por Viagem (rentabilidade por perna).
- **Subcontratação**:
  - CT-e subcontratado deve ser marcado explicitamente (ex.: `isSubcontracted`) e, futuramente, vinculado ao CT-e original do contratante.
  - Ao selecionar um CT-e subcontratado, as NF-es associadas devem ser “bloqueadas” para quaisquer outros embarques.
- **MDF-e (futuro)**: “envelopa” todos os CT-es da Viagem; exige ordem de paradas.

### 1. Cargas Disponíveis
Cargas que foram cadastradas e programadas no sistema, porém **ainda não estão vinculadas** a nenhuma viagem ou veículo específico. Estão aguardando alocação.

### 2. Veículos Disponíveis
Lista de veículos (conjuntos) e seus respectivos motoristas que estão livres para realizar novas viagens.
> **Regra de Prioridade:** A ordenação segue a disponibilidade, onde os que estão há mais tempo "parados" aparecem no topo da lista.

### 3. Viagem Agendada
Estado onde houve a **junção** entre o recurso (motorista + conjunto) e a demanda (carga). A viagem está planejada, mas o motorista ainda não iniciou a operação.

### 4. Em Coleta
O motorista **iniciou a viagem** e está se deslocando para o local de coleta, mas ainda não está com a carga física no veículo (ainda não carregou).

### 5. Em Rota
O veículo já foi **carregado** e o motorista iniciou o percurso efetivo de transporte (seja para entrega ou transferência).

### 6. Viagem Entregue
Ciclo completo. O motorista realizou a ida (entrega), o retorno, e já está de volta na cidade base da empresa, concluindo a viagem. O veículo volta a ficar disponível.
