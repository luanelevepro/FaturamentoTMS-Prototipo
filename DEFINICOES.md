# Definições do Projeto

Este documento define os principais conceitos e estados utilizados na Torre de Controle do sistema.

## Glossário de Termos

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
