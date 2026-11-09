# Repositório de QA - EBAC

| Pasta | Conteúdo |
|---|---|
| [hub-de-leitura-integrado](hub-de-leitura-integrado/) | Aplicação Hub de Leitura (API Express + frontend), o sistema que é testado |
| [hub-de-leitura-teste-ui](hub-de-leitura-teste-ui/) | Testes automatizados com Cypress: interface (`cypress/e2e`), API do catálogo (`cypress/e2e/api`) e aula de seletores |
| [hub-de-leitura-postman](hub-de-leitura-postman/) | Collection de testes de API no Postman/Newman (CT-01 a CT-31), reaproveitada nos testes de API com Cypress |

## Início rápido

```bash
# Terminal 1: aplicação
cd hub-de-leitura-integrado
npm install
npm start

# Terminal 2: testes
cd hub-de-leitura-teste-ui
npm install
npm run cy:open
```

Para rodar só os testes de API do catálogo de livros, com o app no ar:

```bash
cd hub-de-leitura-teste-ui
npm run test:api
```

Mais detalhes no README de cada pasta.
