# Como Acessar o Protótipo Externamente

Existem três formas principais de disponibilizar o acesso ao protótipo para outras pessoas.

Importante: Em todas as opções, o aplicativo deve estar rodando (`.\start_app.ps1`).

## Opção 1: Rede Local (Mesmo WiFi)
Ideal para testar com colegas que estão no mesmo escritório/casa.

1.  Abra um terminal (PowerShell ou CMD).
2.  Descubra seu endereço IP local:
    ```powershell
    ipconfig
    ```
    Procure por `Endereço IPv4` (ex: `192.168.1.15`).
3.  A outra pessoa deve acessar no navegador dela:
    `http://192.168.1.15:3000` (substitua pelo seu IP).

*Nota: Se não carregar, verifique se o Firewall do Windows não está bloqueando o Node.js.*

## Opção 2: Internet (Rápido - Sem cadastro)
Usando o **Localtunnel**, você cria um link público temporário sem precisar instalar nada além do Node.js (que já está instalado).

1.  Com o app rodando (em outro terminal), abra um **novo terminal** na pasta do projeto.
2.  Execute:
    ```powershell
    npx localtunnel --port 3000
    ```
3.  O terminal mostrará um link (ex: `https://dark-sky-42.loca.lt`). Envie esse link para a pessoa.
4.  **Atenção**: Ao abrir o link pela primeira vez, a pessoa verá uma tela de aviso pedindo uma senha/IP. O Localtunnel muitas vezes pede o IP externo de quem gerou o link como senha. Você pode pegar seu IP público acessando [ipv4.icanhazip.com](https://ipv4.icanhazip.com) e passar para ela.

## Opção 3: Internet (Estável - Ngrok)
O **Ngrok** é mais robusto e profissional para demonstrações externas.

1.  Baixe e instale o Ngrok em [ngrok.com/download](https://ngrok.com/download).
2.  Crie uma conta gratuita e configure seu token (comando que o site fornece).
3.  Com o app rodando, abra um terminal e execute:
    ```powershell
    ngrok http 3000
    ```
4.  Copie o link `https://....ngrok-free.app` e envie para a pessoa.

---

### Resumo Técnico
O projeto roda em:
-   **Frontend**: Porta 3000
-   **Backend**: Porta 3001

As soluções acima expõem a porta 3000 (Frontend). Como o Vite está configurado para fazer proxy das chamadas `/api` para a porta 3001 localmente, tudo deve funcionar transparente para o usuário externo.
