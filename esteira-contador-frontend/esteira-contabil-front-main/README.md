# Esteira Contábil Frontend

Este é o repositório do frontend do projeto Esteira Contábil.

## Instalação de Dependências

Para instalar as dependências do projeto, utilize o gerenciador de pacotes `pnpm`. Execute o seguinte comando no terminal:

```sh
pnpm install
```

## Como Rodar o Projeto

Para rodar o projeto localmente, siga os passos abaixo:

1. Certifique-se de que todas as dependências estão instaladas executando `pnpm install`.
2. Inicie o servidor de desenvolvimento com o comando:

```sh
pnpm dev
```

3. Abra o navegador e acesse `http://localhost:3000` para ver a aplicação em execução.


## Estrutura de Pastas

Abaixo está a estrutura de pastas do projeto e uma breve explicação de cada uma:

- `src/`: Contém o código-fonte do projeto.
	- `components/`: Componentes reutilizáveis da aplicação.
	- `context/`: Provedores de contexto para gerenciamento de estado.
	- `hooks/`: Hooks personalizados para reutilização de lógica.
	- `lib/`: Bibliotecas e utilitários de terceiros.
	- `pages/`: Páginas da aplicação.
	- `services/`: Serviços para comunicação com APIs.
	- `styles/`: Arquivos de estilo (CSS, SASS, etc).
	- `utils/`: Funções utilitárias e helpers.
- `public/`: Arquivos públicos que serão servidos diretamente, como imagens e arquivos estáticos.
- `tests/`: Testes unitários e de integração.


## Extensões Recomendadas

Para uma melhor experiência de desenvolvimento, recomendamos as seguintes extensões do VSCode:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint): Para linting do código.
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode): Para formatação de código.
- [VSCode React](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets): Snippets e suporte para React.
- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens): Ferramentas avançadas para Git.
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss): Suporte para Tailwind CSS, incluindo autocompletar e linting.

## Scripts Disponíveis

No arquivo `package.json`, você encontrará alguns scripts úteis, como:

- `pnpm dev`: Inicia a aplicação em modo de desenvolvimento.
- `pnpm build`: Cria uma versão otimizada para produção.
- `pnpm start`: Inicia a aplicação em modo de produção.
- `pnpm lint`: Executa o linter para verificar problemas no código.


