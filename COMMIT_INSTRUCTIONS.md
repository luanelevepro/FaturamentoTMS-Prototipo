# Instruções para Commit e Push

## Problema Identificado

Há um arquivo de lock do Git (`.git/index.lock`) que está impedindo operações Git. Isso geralmente acontece quando:
- Um editor (VS Code, Cursor) está usando o Git
- Um processo Git está em execução
- Um commit anterior foi interrompido

## Solução

### Opção 1: Usar o Script Automatizado (Recomendado)

1. **Feche o Cursor/VS Code** (ou qualquer editor que esteja usando o Git)
2. Abra o PowerShell como Administrador
3. Execute o script:
   ```powershell
   .\commit_and_push.ps1
   ```
4. Siga as instruções interativas do script

### Opção 2: Comandos Manuais

Se preferir fazer manualmente:

1. **Feche o Cursor/VS Code**

2. **Abra o PowerShell** e navegue até o projeto:
   ```powershell
   cd C:\GITHUB\FaturamentoTMS-Prototipo
   ```

3. **Remova o lock do Git** (se existir):
   ```powershell
   Remove-Item -Force .git/index.lock -ErrorAction SilentlyContinue
   ```

4. **Adicione todos os arquivos**:
   ```powershell
   git add -A
   ```

5. **Verifique o que será commitado**:
   ```powershell
   git status
   ```

6. **Faça o commit**:
   ```powershell
   git commit -m "feat: implementação completa do fluxo operacional e regras de negócio

   - Adiciona sistema de match de segmentos operacionais
   - Implementa validações e bloqueios de segurança
   - Adiciona botão de emissão de CT-e por carga
   - Implementa máquina de estados completa
   - Melhora leiturabilidade dos cards
   - Atualiza modelagem do banco
   - Adiciona documentação completa"
   ```

7. **Faça o push**:
   ```powershell
   git push origin main
   ```

### Opção 3: Usar Git GUI

Se os comandos não funcionarem, você pode usar uma interface gráfica:

1. **GitHub Desktop**: Abra o projeto no GitHub Desktop e faça commit/push pela interface
2. **VS Code**: Feche e reabra, depois use a interface de Source Control
3. **GitKraken / Sourcetree**: Use qualquer cliente Git GUI

## Arquivos que Serão Commitados

### Documentação (Novos)
- `ANALISE_ESTEIRA_CONTABIL.md`
- `ANALISE_PROJETO.md`
- `ARCHITECTURE.md`
- `EXTERNAL_ACCESS.md`
- `FLUXO_OPERACIONAL.md`
- `MODELAGEM_CARGA_CTE.md`
- `REGRAS_NEGOCIO.md`

### Código Novo
- `config/segmentos.ts` - Sistema de match de segmentos
- `lib/validations.ts` - Validações e bloqueios
- `components/LoadCardInTrip.tsx` - Card de carga com CT-e
- `components/ErrorBoundary.tsx` - Tratamento de erros

### Código Modificado
- `App.tsx` - Handlers atualizados
- `types.ts` - Tipos atualizados (CTe, Load, Trip)
- `components/TripBoardV2.tsx` - Leiturabilidade melhorada
- `components/ScheduleLoadModal.tsx` - Validações de segmento
- `server/db/schema.sql` - Nova modelagem (Carga vs CT-e)

### Arquivos Deletados
- `Novo.pdf`
- `components/TripBoardV2.tsx.bak`

## Nota sobre `esteira-contador-frontend/`

O diretório `esteira-contador-frontend/` contém o projeto Esteira Contábil analisado. 

**Decisão necessária**: Você quer commitá-lo ou adicioná-lo ao `.gitignore`?

- **Se quiser commitá-lo**: Será incluído no commit
- **Se quiser ignorá-lo**: Adicione ao `.gitignore` antes do commit:
  ```powershell
  echo "esteira-contador-frontend/" >> .gitignore
  ```

## Verificação Pós-Commit

Após o commit, verifique:

```powershell
git log --oneline -1
git status
```

Se tudo estiver OK, você verá:
- Um novo commit no histórico
- `Your branch is ahead of 'origin/main' by 1 commit` (antes do push)
- `nothing to commit, working tree clean` (após push)

## Troubleshooting

### Erro: "Permission denied"
- Feche todos os editores
- Verifique se há processos Git: `Get-Process | Where-Object {$_.ProcessName -like "*git*"}`
- Execute PowerShell como Administrador

### Erro: "Failed to connect to github.com"
- Verifique sua conexão com a internet
- Verifique se há proxy/firewall bloqueando
- Tente: `git config --global http.proxy ""` (se não usar proxy)
- Ou configure o proxy: `git config --global http.proxy http://proxy:port`

### Erro: "Authentication failed"
- Configure suas credenciais: `git config --global user.name "Seu Nome"`
- Configure seu email: `git config --global user.email "seu@email.com"`
- Para HTTPS, use Personal Access Token do GitHub
