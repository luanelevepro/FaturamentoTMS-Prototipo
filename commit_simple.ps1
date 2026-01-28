# Versão simplificada do script de commit
# Execute: .\commit_simple.ps1

cd C:\GITHUB\FaturamentoTMS-Prototipo

# Remover lock
if (Test-Path ".git/index.lock") {
    Remove-Item -Force ".git/index.lock" -ErrorAction SilentlyContinue
}

# Adicionar tudo
git add -A

# Mostrar status
Write-Host "`nArquivos que serão commitados:" -ForegroundColor Cyan
git status --short

# Fazer commit
Write-Host "`nFazendo commit..." -ForegroundColor Yellow
git commit -m "feat: implementação completa do fluxo operacional e regras de negócio" -m "- Adiciona sistema de match de segmentos operacionais" -m "- Implementa validações e bloqueios de segurança" -m "- Adiciona botão de emissão de CT-e por carga" -m "- Implementa máquina de estados completa" -m "- Adiciona funcionalidade de adicionar carga em movimento" -m "- Melhora leiturabilidade dos cards" -m "- Atualiza modelagem do banco" -m "- Adiciona documentação completa"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nOK Commit realizado!`n" -ForegroundColor Green
    $push = Read-Host "Fazer push agora? (S/N)"
    if ($push -eq "S" -or $push -eq "s") {
        git push origin main
    }
} else {
    Write-Host "`nERRO no commit`n" -ForegroundColor Red
}
