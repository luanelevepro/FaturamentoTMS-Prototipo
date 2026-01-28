# Separação de Componentes por Módulos

Organize os componentes combinando-os por domínio ou funcionalidade. Note que todos os componentes que implementam regras de negócio, incluindo os de Administrativo, Fiscal, Embarcador, Recursos Humanos e Contabilidade, devem permanecer dentro da pasta **general**.

Essa abordagem facilita a manutenção e a escalabilidade, concentrando as regras de negócio em um único local, enquanto os componentes reutilizáveis (UI, layout, navegação) ficam organizados em pastas separadas.

Exemplo de Estrutura:

```
src/
 ├── components/
 |    ├── general/             // Componentes de regras de negócio (Administrativo, Fiscal, Embarcador, Recursos Humanos, Contabilidade)
 |         ├── administrativo/
 |         ├── fiscal/
 |         ├── embarcador/
 |         ├── recursos-humanos/
 |         └── contabilidade/
 |    ├── ui/                  // Componentes reutilizáveis (botões, inputs)
 |    └── layout/              // Layouts e estrutura de páginas
```