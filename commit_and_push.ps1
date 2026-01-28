# Script para fazer commit e push das alterações
# Execute este script quando não houver processos Git em execução

Write-Host "=== Commit e Push do Projeto ===" -ForegroundColor Cyan
Write-Host ""

# Navegar para o diretório do projeto
Set-Location "C:\GITHUB\FaturamentoTMS-Prototipo"

# Verificar se há processos Git em execução
$gitProcesses = Get-Process | Where-Object {$_.ProcessName -like "*git*"}
if ($gitProcesses) {
    Write-Host "AVISO: Há processos Git em execução. Aguarde ou feche-os." -ForegroundColor Yellow
    Write-Host "Processos encontrados:" -ForegroundColor Yellow
    $gitProcesses | ForEach-Object { Write-Host "  - $($_.ProcessName) (PID: $($_.Id))" }
    Write-Host ""
    $continue = Read-Host "Deseja continuar mesmo assim? (S/N)"
    if ($continue -ne "S" -and $continue -ne "s") {
        exit
    }
}

# Remover lock do Git se existir
if (Test-Path ".git/index.lock") {
    Write-Host "Removendo arquivo de lock do Git..." -ForegroundColor Yellow
    Remove-Item -Force ".git/index.lock" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Verificar status
Write-Host "Verificando status do Git..." -ForegroundColor Cyan
git status --short | Select-Object -First 20

Write-Host ""
$confirm = Read-Host "Deseja adicionar TODOS os arquivos modificados e novos? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Operação cancelada." -ForegroundColor Yellow
    exit
}

# Adicionar todos os arquivos
Write-Host ""
Write-Host "Adicionando arquivos ao staging..." -ForegroundColor Cyan
git add -A

# Verificar o que foi adicionado
Write-Host ""
Write-Host "Arquivos no staging:" -ForegroundColor Green
git status --short

Write-Host ""
Write-Host "Mensagem do commit:" -ForegroundColor Cyan
Write-Host "feat: implementação completa do fluxo operacional e regras de negócio" -ForegroundColor White
Write-Host ""
Write-Host "  - Adiciona sistema de match de segmentos operacionais" -ForegroundColor Gray
Write-Host "  - Implementa validações e bloqueios de segurança (Hard Blocks e Warnings)" -ForegroundColor Gray
Write-Host "  - Adiciona botão de emissão de CT-e por carga (visual/gerencial)" -ForegroundColor Gray
Write-Host "  - Implementa máquina de estados completa (Carga e Viagem)" -ForegroundColor Gray
Write-Host "  - Adiciona funcionalidade de adicionar carga em movimento (retorno)" -ForegroundColor Gray
Write-Host "  - Melhora leiturabilidade dos cards no Kanban" -ForegroundColor Gray
Write-Host "  - Atualiza modelagem do banco (Carga vs CT-e vs Entrega)" -ForegroundColor Gray
Write-Host "  - Adiciona documentação completa" -ForegroundColor Gray
Write-Host "  - Adiciona análise do projeto Esteira Contábil para referência futura" -ForegroundColor Gray

Write-Host ""
$commitConfirm = Read-Host "Deseja fazer o commit com a mensagem acima? (S/N)"
if ($commitConfirm -ne "S" -and $commitConfirm -ne "s") {
    Write-Host "Operação cancelada." -ForegroundColor Yellow
    exit
}

# Fazer commit
Write-Host ""
Write-Host "Fazendo commit..." -ForegroundColor Cyan

$commitMsg = "feat: implementação completa do fluxo operacional e regras de negócio`n`n- Adiciona sistema de match de segmentos operacionais`n- Implementa validações e bloqueios de segurança (Hard Blocks e Warnings)`n- Adiciona botão de emissão de CT-e por carga (visual/gerencial)`n- Implementa máquina de estados completa (Carga e Viagem)`n- Adiciona funcionalidade de adicionar carga em movimento (retorno)`n- Melhora leiturabilidade dos cards no Kanban`n- Atualiza modelagem do banco (Carga vs CT-e vs Entrega)`n- Adiciona documentação completa (FLUXO_OPERACIONAL.md, REGRAS_NEGOCIO.md, etc.)`n- Adiciona análise do projeto Esteira Contábil para referência futura"

git commit -m $commitMsg

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "OK Commit realizado com sucesso!" -ForegroundColor Green
    
    # Perguntar sobre push
    Write-Host ""
    $pushConfirm = Read-Host "Deseja fazer push para o repositório remoto? (S/N)"
    if ($pushConfirm -eq "S" -or $pushConfirm -eq "s") {
        Write-Host ""
        Write-Host "Fazendo push para origin/main..." -ForegroundColor Cyan
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "OK Push realizado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "ERRO ao fazer push. Verifique sua conexão e credenciais." -ForegroundColor Red
            Write-Host "Você pode tentar novamente com: git push origin main" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "Commit realizado. Para fazer push depois, execute: git push origin main" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "ERRO ao fazer commit." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Concluído ===" -ForegroundColor Cyan
