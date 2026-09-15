# hub-de-leitura-teste-ui

Testes E2E com Cypress do curso de QA da EBAC.

## Estrutura

```
cypress/
├── e2e/
│   ├── *.cy.js              # Testes do Hub de Leitura (precisam do app rodando em localhost:3000)
│   └── seletores/           # Aula extra de seletores (página estática, não precisa do app)
├── fixtures/                # Massa de dados (livros, usuário)
└── support/
    ├── commands.js
    └── pages/               # Page Objects
pages/
└── seletores.html           # Página usada pelos testes de seletores
```

## Como executar

```bash
npm install
```

Os testes do Hub de Leitura precisam do app (pasta vizinha `../hub-de-leitura-integrado`), mas tudo pode ser feito daqui:

```bash
npm run app:install   # uma vez: instala as dependências do app
npm run test:e2e      # sobe o app, espera a porta 3000, roda os testes e desliga o app
```

| Comando | O que faz |
|---|---|
| `npm run app` | Sobe o app em http://localhost:3000 (para usar com `cy:open`) |
| `npm run app:db` | Recria o banco de dados do app |
| `npm run test:e2e` | Sobe o app e roda todos os testes |
| `npm run cy:open` | Abre o Cypress no modo interativo |
| `npm test` | Roda todos os testes no Chrome |
| `npm run test:hub` | Roda só os testes do Hub de Leitura |
| `npm run test:seletores` | Roda só os testes de seletores |
| `npm run cy:report` | Roda e grava os resultados no Cypress Cloud |
