# hub-de-leitura-teste-ui

Testes automatizados com Cypress do curso de QA da EBAC.

## Estrutura

```
cypress/
├── e2e/
│   ├── *.cy.js              # Testes de interface do Hub de Leitura (precisam do app em localhost:3000)
│   ├── api/                 # Testes de API do catálogo de livros (cy.request)
│   └── seletores/           # Aula extra de seletores (página estática, não precisa do app)
├── fixtures/                # Massa de dados (livros, usuário, massa dos testes de API)
│   └── api/
└── support/
    ├── commands.js          # Comandos personalizados (login, preencherCadastro, geraToken)
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
| `npm run test:hub` | Roda só os testes de interface do Hub de Leitura |
| `npm run test:api` | Roda só os testes de API do catálogo de livros |
| `npm run test:seletores` | Roda só os testes de seletores |
| `npm run cy:report` | Roda e grava os resultados no Cypress Cloud |

## Testes de API — Catálogo de Livros

`cypress/e2e/api/catalogo-livros.cy.js` cobre a API do catálogo com `cy.request()`, nos mesmos
31 cenários da collection do Postman (`../hub-de-leitura-postman`), identificados de CT-01 a CT-31:

| Bloco | Cenários | Cobertura |
|---|---|---|
| 1. Autenticação | CT-01 a CT-03 | Login de admin e de usuário comum (tokens usados pelos demais blocos) e senha incorreta (401) |
| 2. Consultas (GET) | CT-04 a CT-13 | Listagem, categorias, autores, busca, filtros, paginação, consulta por ID, ID inexistente (404) e ID inválido (400) |
| 3. Cadastro (POST) | CT-14 a CT-20 | Cadastro como admin (201), duplicidade, campo obrigatório ausente, `format` inválido, ano futuro, sem token (401) e sem permissão (403) |
| 4. Atualização (PUT) | CT-21 a CT-25 | Atualização como admin, confirmação da persistência, livro inexistente (404), payload inválido (400) e sem permissão (403) |
| 5. Exclusão (DELETE) | CT-26 a CT-31 | Sem token (401), sem permissão (403), exclusão como admin (200), confirmação da exclusão (404), ID inexistente (404) e ID inválido (400) |

Pontos de atenção:

- **Executar o arquivo inteiro, na ordem.** O CT-01 e o CT-02 geram os tokens usados pelos
  blocos seguintes, e o ID do livro criado no CT-14 é o que o PUT altera e o DELETE exclui.
- **A suíte é repetível.** O título do livro recebe um timestamp (regra de duplicidade) e o
  registro criado é excluído no CT-28, então rodar várias vezes não acumula dados na base.
- **Asserções globais.** A função `validacoesGlobais()` repete em toda resposta as três
  verificações globais da collection: ausência de erro 5xx, tempo abaixo de 3000 ms e JSON válido.
- **Token.** A API devolve o token já com o prefixo `Bearer`, então o header `Authorization`
  recebe o valor como veio do login, sem concatenar nada.
