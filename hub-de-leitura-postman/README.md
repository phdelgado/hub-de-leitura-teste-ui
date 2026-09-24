# Testes de API — Hub de Leitura (Catálogo de Livros)

Entrega do exercício de **Testes de API com Postman** — EBAC.

Collection de testes da funcionalidade **Catálogo de Livros** da [Hub de Leitura API](https://github.com/EBAC-QE/hub-de-leitura-api), executada contra o servidor local (`http://localhost:3000`).

## Resultado da execução

Collection executada via **Newman** (CLI do Postman), com a API rodando em `localhost:3000`:

```
┌─────────────────────────┬───────────────────┬───────────────────┐
│                         │          executed │            failed │
├─────────────────────────┼───────────────────┼───────────────────┤
│                requests │                31 │                 0 │
│            test-scripts │                62 │                 0 │
│      prerequest-scripts │                 2 │                 0 │
│              assertions │               188 │                 0 │
└─────────────────────────┴───────────────────┴───────────────────┘
```

**31 requisições · 188 asserções · 0 falhas.**

## Arquivos

| Arquivo | Descrição |
| --- | --- |
| `Hub-de-Leitura-Catalogo-de-Livros.postman_collection.json` | Collection com os 31 cenários de teste |
| `Hub-de-Leitura-Local.postman_environment.json` | Environment com `base_url` e credenciais de teste |

## Cobertura

- **Métodos HTTP:** GET, POST, PUT e DELETE
- **15 cenários positivos** e **16 cenários negativos** (400, 401, 403 e 404)
- **Asserções em todas as requisições**, incluindo três asserções globais aplicadas a toda a collection

## Como executar

### 1. Suba a API localmente

```bash
git clone https://github.com/EBAC-QE/hub-de-leitura-api.git
cd hub-de-leitura-api
npm install
npm start
```

A API sobe em `http://localhost:3000` e a documentação Swagger fica em `http://localhost:3000/api-docs`.

### 2. Importe no Postman

1. **Import** → selecione os dois arquivos `.json` deste repositório.
2. Selecione o environment **Hub de Leitura - Local** no canto superior direito.
3. Abra o **Collection Runner**, selecione a collection inteira e clique em **Run**.

> Execute a collection **na ordem em que está**: a pasta 1 gera os tokens usados pelas demais e o livro criado no CT-14 é consumido pelas pastas de PUT e DELETE.

### 3. Alternativa por linha de comando (Newman)

```bash
npx newman run Hub-de-Leitura-Catalogo-de-Livros.postman_collection.json \
  -e Hub-de-Leitura-Local.postman_environment.json
```

## Mapeamento dos cenários

### 1. Autenticação (pré-requisito)

| ID | Cenário | Método | Endpoint | Esperado |
| --- | --- | --- | --- | --- |
| CT-01 | Login como administrador | POST | `/api/login` | 200 |
| CT-02 | Login como usuário comum | POST | `/api/login` | 200 |
| CT-03 | Login com senha incorreta | POST | `/api/login` | 401 |

### 2. Catálogo — Consultas (GET)

| ID | Cenário | Método | Endpoint | Esperado |
| --- | --- | --- | --- | --- |
| CT-04 | Listar todos os livros | GET | `/api/books` | 200 |
| CT-05 | Listar categorias do acervo | GET | `/api/books/categories` | 200 |
| CT-06 | Listar autores do acervo | GET | `/api/books/authors` | 200 |
| CT-07 | Buscar livro por termo | GET | `/api/books?search=` | 200 |
| CT-08 | Filtrar por categoria | GET | `/api/books?category=` | 200 |
| CT-09 | Filtrar por disponibilidade | GET | `/api/books?available=true` | 200 |
| CT-10 | Paginação do catálogo | GET | `/api/books?limit=5&page=2` | 200 |
| CT-11 | Detalhes de um livro por ID | GET | `/api/books/:id` | 200 |
| CT-12 | Consultar livro inexistente | GET | `/api/books/999999` | 404 |
| CT-13 | Consultar livro com ID inválido | GET | `/api/books/abc` | 400 |

### 3. Catálogo — Cadastro (POST)

| ID | Cenário | Método | Endpoint | Esperado |
| --- | --- | --- | --- | --- |
| CT-14 | Cadastrar novo livro como admin | POST | `/api/books` | 201 |
| CT-15 | Cadastrar livro duplicado | POST | `/api/books` | 400 |
| CT-16 | Cadastrar sem o campo `title` | POST | `/api/books` | 400 |
| CT-17 | Cadastrar com `format` inválido | POST | `/api/books` | 400 |
| CT-18 | Cadastrar com ano de publicação futuro | POST | `/api/books` | 400 |
| CT-19 | Cadastrar sem token | POST | `/api/books` | 401 |
| CT-20 | Cadastrar como usuário comum | POST | `/api/books` | 403 |

### 4. Catálogo — Atualização (PUT)

| ID | Cenário | Método | Endpoint | Esperado |
| --- | --- | --- | --- | --- |
| CT-21 | Atualizar livro como admin | PUT | `/api/books/:id` | 200 |
| CT-22 | Confirmar que a alteração foi persistida | GET | `/api/books/:id` | 200 |
| CT-23 | Atualizar livro inexistente | PUT | `/api/books/999999` | 404 |
| CT-24 | Atualizar sem o campo `author` | PUT | `/api/books/:id` | 400 |
| CT-25 | Atualizar como usuário comum | PUT | `/api/books/:id` | 403 |

### 5. Catálogo — Exclusão (DELETE)

| ID | Cenário | Método | Endpoint | Esperado |
| --- | --- | --- | --- | --- |
| CT-26 | Excluir sem token | DELETE | `/api/books/:id` | 401 |
| CT-27 | Excluir como usuário comum | DELETE | `/api/books/:id` | 403 |
| CT-28 | Excluir livro como admin | DELETE | `/api/books/:id` | 200 |
| CT-29 | Confirmar que o livro foi excluído | GET | `/api/books/:id` | 404 |
| CT-30 | Excluir livro inexistente | DELETE | `/api/books/999999` | 404 |
| CT-31 | Excluir com ID inválido | DELETE | `/api/books/abc` | 400 |

## Regras de negócio validadas

Além do status code, cada requisição valida o cumprimento das regras de negócio do catálogo:

| Regra de negócio | Onde é validada |
| --- | --- |
| Exemplares disponíveis nunca excedem o total do acervo | CT-04, CT-22 |
| Livro novo entra com todos os exemplares disponíveis | CT-14 |
| Exemplares reservados = total − disponíveis | CT-11 |
| O status de disponibilidade reflete o estoque (`available` / `unavailable`) | CT-11 |
| A busca retorna apenas livros cujo título ou autor contêm o termo | CT-07 |
| O filtro por categoria retorna apenas livros daquela categoria | CT-08 |
| O filtro `available=true` retorna apenas livros com estoque | CT-09 |
| `totalPages` e `hasNext`/`hasPrev` são coerentes com o total de itens | CT-10 |
| Categoria e autor listados possuem ao menos uma obra | CT-05, CT-06 |
| Não existem dois livros com o mesmo título e autor | CT-15 |
| `format` aceita apenas Físico, Digital ou Audiobook | CT-17 |
| Ano de publicação não pode ultrapassar o ano corrente | CT-18 |
| Apenas administradores cadastram, alteram e excluem livros | CT-19, CT-20, CT-25, CT-26, CT-27 |
| Payload inválido não cria nem altera registros | CT-16, CT-24 |
| Falha de login não emite token | CT-03 |
| Alterações são efetivamente persistidas no banco | CT-22 |
| Livro excluído deixa de ser retornado pelo catálogo | CT-29 |

## Recursos do Postman utilizados

- **Variáveis de collection e de environment** — `base_url`, tokens e massa de teste encadeada entre requisições
- **Pre-request Scripts** — geram um título único a cada execução, tornando a collection repetível sem esbarrar na regra de duplicidade
- **Tests (asserções)** — `pm.test` com `pm.expect`/Chai em todas as requisições
- **Scripts no nível da collection** — três asserções globais aplicadas a toda requisição: ausência de erro 5xx, tempo de resposta abaixo de 3000 ms e resposta em JSON válido
- **Encadeamento de requisições** — o token do login e o ID do livro criado alimentam os cenários seguintes
- **Query params documentados** — cada parâmetro de filtro e paginação tem descrição própria
- **Collection Runner / Newman** — execução completa da suíte em ordem

## Observações técnicas

- O endpoint `/api/login` devolve o token **já com o prefixo `Bearer`**. Por isso o header `Authorization` recebe apenas `{{token_admin}}`, sem repetir o prefixo.
- A collection é **idempotente**: o livro criado no CT-14 recebe um título com timestamp e é excluído no CT-28, de modo que execuções repetidas não acumulam registros na base.
- Os cenários negativos de permissão do DELETE (CT-26 e CT-27) rodam **antes** da exclusão efetiva, garantindo que o recurso ainda existe quando a regra de permissão é avaliada — sem isso o teste passaria por 404 em vez de 401/403.

## Credenciais de teste

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@biblioteca.com` | `admin123` |
| Usuário comum | `usuario@teste.com` | `user123` |
