/// <reference types="cypress" />

import usuarios from '../../fixtures/api/usuarios.json'
import livroBase from '../../fixtures/api/livro.json'

// Testes automatizados de API da funcionalidade Catálogo de Livros.
// São os mesmos 31 cenários da collection do Postman (CT-01 a CT-31),
// aqui escritos com cy.request().
//
// O arquivo roda na ordem em que está: o bloco 1 gera os tokens usados pelos
// demais, o livro criado no CT-14 é o que os blocos de PUT e DELETE alteram e
// excluem, e os negativos de permissão do DELETE (CT-26 e CT-27) vêm antes da
// exclusão efetiva, para que a regra avaliada seja a de permissão e não 404.

const LIVROS = 'api/books'
const LOGIN = 'api/login'
const ID_INEXISTENTE = 999999
const ID_INVALIDO = 'abc'

// Encadeamento entre as requisições
let tokenAdmin
let tokenUser
let livroId
let livroTitulo
let livroTituloEditado
const livroAutor = 'Pedro Delgado'

// Massa derivada do próprio acervo
let livroIdConsulta
let termoBusca
let categoriaFiltro

// As três asserções globais da collection, aplicadas a toda resposta.
const validacoesGlobais = (response) => {
    expect(response.status, '[Global] a API não retorna erro interno (5xx)').to.be.below(500)
    expect(response.duration, '[Global] tempo de resposta abaixo de 3000ms').to.be.below(3000)
    expect(response.headers['content-type'], '[Global] a resposta é um JSON válido').to.include('application/json')
}

describe('Testes de API: Catálogo de Livros', () => {

    describe('1. Autenticação (pré-requisito)', () => {

        it('CT-01 - Deve fazer login como administrador (200)', () => {
            cy.request({
                method: 'POST',
                url: LOGIN,
                body: {
                    email: usuarios.admin.email,
                    password: usuarios.admin.senha
                }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code').to.eq(200)
                expect(response.body.token, 'token JWT no formato Bearer').to.match(/^Bearer eyJ/)
                expect(response.body.isAdmin, 'regra de negócio: usuário autenticado é administrador').to.be.true
                expect(response.body.email).to.eq(usuarios.admin.email)

                tokenAdmin = response.body.token
            })
        })

        it('CT-02 - Deve fazer login como usuário comum (200)', () => {
            cy.request({
                method: 'POST',
                url: LOGIN,
                body: {
                    email: usuarios.comum.email,
                    password: usuarios.comum.senha
                }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code').to.eq(200)
                expect(response.body.token, 'token JWT').to.match(/^Bearer eyJ/)
                expect(response.body.isAdmin, 'regra de negócio: usuário comum NÃO é administrador').to.be.false

                tokenUser = response.body.token
            })
        })

        it('CT-03 - Não deve fazer login com senha incorreta (401)', () => {
            cy.request({
                method: 'POST',
                url: LOGIN,
                failOnStatusCode: false,
                body: {
                    email: usuarios.admin.email,
                    password: usuarios.senhaIncorreta
                }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code 401 (não autorizado)').to.eq(401)
                expect(response.body.error, 'código de erro').to.eq('INVALID_CREDENTIALS')
                expect(response.body, 'regra de negócio: nenhum token é emitido em falha de login')
                    .to.not.have.property('token')
            })
        })
    })

    describe('2. Catálogo - Consultas (GET)', () => {

        it('CT-04 - Deve listar todos os livros (200)', () => {
            cy.request({
                method: 'GET',
                url: LIVROS,
                qs: { limit: 20, page: 1 }
            }).then((response) => {
                validacoesGlobais(response)
                const { books, pagination } = response.body

                expect(response.status, 'status code').to.eq(200)
                expect(response.headers['content-type'], 'Content-Type').to.include('application/json')

                // Contrato da resposta
                expect(response.body).to.have.property('books')
                expect(response.body).to.have.property('pagination')
                expect(response.body).to.have.property('filters')
                expect(books, 'lista de livros').to.be.an('array').and.not.be.empty

                books.forEach((livro) => {
                    expect(livro, 'id').to.have.property('id').that.is.a('number')
                    expect(livro.title, 'title').to.be.a('string').and.not.be.empty
                    expect(livro.author, 'author').to.be.a('string').and.not.be.empty
                    expect(livro).to.have.property('total_copies')
                    expect(livro).to.have.property('available_copies')

                    // Regra de negócio: disponíveis nunca excedem o total em acervo
                    expect(livro.available_copies, `livro id ${livro.id}`).to.be.at.most(livro.total_copies)
                    expect(livro.available_copies, `livro id ${livro.id}`).to.be.at.least(0)
                })

                // Paginação coerente com o limit enviado
                expect(pagination.limit).to.eq(20)
                expect(pagination.currentPage).to.eq(1)
                expect(books.length).to.be.at.most(pagination.limit)
                expect(pagination.showing).to.eq(books.length)

                // Massa para as próximas requisições
                livroIdConsulta = books[0].id
                termoBusca = books[0].title.split(' ')[0]
            })
        })

        it('CT-05 - Deve listar as categorias do acervo (200)', () => {
            cy.request({
                method: 'GET',
                url: `${LIVROS}/categories`
            }).then((response) => {
                validacoesGlobais(response)
                const { categories, total } = response.body

                expect(response.status, 'status code').to.eq(200)
                expect(categories, 'lista de categorias').to.be.an('array').and.not.be.empty
                expect(total, 'total de categorias').to.eq(categories.length)

                categories.forEach((categoria) => {
                    // Regra de negócio: categoria listada tem nome preenchido e ao menos 1 livro
                    expect(categoria.name, 'nome da categoria').to.be.a('string').and.not.be.empty
                    expect(categoria.bookCount, `categoria ${categoria.name}`).to.be.at.least(1)
                })

                categoriaFiltro = categories[0].name
            })
        })

        it('CT-06 - Deve listar os autores do acervo (200)', () => {
            cy.request({
                method: 'GET',
                url: `${LIVROS}/authors`
            }).then((response) => {
                validacoesGlobais(response)
                const { authors, total } = response.body

                expect(response.status, 'status code').to.eq(200)
                expect(authors, 'lista de autores').to.be.an('array').and.not.be.empty
                expect(total, 'total de autores').to.eq(authors.length)

                authors.forEach((autor) => {
                    // Regra de negócio: autor listado possui ao menos 1 obra no acervo
                    expect(autor.name, 'nome do autor').to.be.a('string').and.not.be.empty
                    expect(autor.bookCount, `autor ${autor.name}`).to.be.at.least(1)
                })
            })
        })

        it('CT-07 - Deve buscar livro por termo (200)', () => {
            cy.request({
                method: 'GET',
                url: LIVROS,
                qs: { search: termoBusca }
            }).then((response) => {
                validacoesGlobais(response)
                const { books, filters } = response.body
                const termo = termoBusca.toLowerCase()

                expect(response.status, 'status code').to.eq(200)
                expect(filters.search, 'filtro devolvido na resposta').to.eq(termoBusca)
                expect(books, 'a busca retorna ao menos um resultado').to.have.length.of.at.least(1)

                books.forEach((livro) => {
                    // Regra de negócio: todo resultado contém o termo no título ou no autor
                    const encontrou = livro.title.toLowerCase().includes(termo) ||
                        livro.author.toLowerCase().includes(termo)
                    expect(encontrou, `livro "${livro.title}" contém "${termoBusca}"`).to.be.true
                })
            })
        })

        it('CT-08 - Deve filtrar livros por categoria (200)', () => {
            cy.request({
                method: 'GET',
                url: LIVROS,
                qs: { category: categoriaFiltro }
            }).then((response) => {
                validacoesGlobais(response)
                const { books, filters } = response.body

                expect(response.status, 'status code').to.eq(200)
                expect(filters.category, 'categoria ecoada em filters').to.eq(categoriaFiltro)
                expect(books, 'resultado do filtro').to.have.length.of.at.least(1)

                books.forEach((livro) => {
                    // Regra de negócio: todos os livros retornados pertencem à categoria filtrada
                    expect(livro.category, `livro "${livro.title}"`).to.eq(categoriaFiltro)
                })
            })
        })

        it('CT-09 - Deve filtrar livros por disponibilidade (200)', () => {
            cy.request({
                method: 'GET',
                url: LIVROS,
                qs: { available: 'true' }
            }).then((response) => {
                validacoesGlobais(response)
                const { books, filters } = response.body

                expect(response.status, 'status code').to.eq(200)
                expect(filters.available, 'filtro de disponibilidade ecoado').to.eq('true')

                books.forEach((livro) => {
                    // Regra de negócio: todo livro retornado tem exemplar disponível
                    expect(livro.available_copies, `livro "${livro.title}"`).to.be.greaterThan(0)
                })
            })
        })

        it('CT-10 - Deve paginar o catálogo (200)', () => {
            cy.request({
                method: 'GET',
                url: LIVROS,
                qs: { limit: 5, page: 2 }
            }).then((response) => {
                validacoesGlobais(response)
                const { books, pagination } = response.body

                expect(response.status, 'status code').to.eq(200)
                expect(books.length, 'no máximo 5 livros na página').to.be.at.most(5)
                expect(pagination.limit).to.eq(5)
                expect(pagination.currentPage).to.eq(2)

                // Regra de negócio: offset da 2a página é limit * 1
                expect(pagination.offset, 'offset da 2a página').to.eq(5)

                // Regra de negócio: totalPages e hasNext/hasPrev coerentes com o total
                expect(pagination.hasPrev, 'hasPrev fora da primeira página').to.be.true
                expect(pagination.totalPages).to.eq(Math.ceil(pagination.total / pagination.limit))
                expect(pagination.hasNext, 'hasNext').to.eq(pagination.currentPage < pagination.totalPages)
            })
        })

        it('CT-11 - Deve consultar os detalhes de um livro por ID (200)', () => {
            cy.request({
                method: 'GET',
                url: `${LIVROS}/${livroIdConsulta}`
            }).then((response) => {
                validacoesGlobais(response)
                const { book, availability, statistics } = response.body

                expect(response.status, 'status code').to.eq(200)

                // Contrato da resposta
                expect(response.body).to.have.property('book')
                expect(response.body).to.have.property('availability')
                expect(response.body).to.have.property('statistics')
                expect(statistics).to.have.property('total_reservations')

                expect(book.id, 'o livro retornado é o solicitado na URL').to.eq(livroIdConsulta)

                // Regra de negócio: exemplares reservados = total - disponíveis
                expect(availability.reserved_copies, 'reservados')
                    .to.eq(availability.total_copies - availability.available_copies)

                // Regra de negócio: status de disponibilidade reflete o estoque
                expect(availability.isAvailable).to.eq(availability.available_copies > 0)
                expect(availability.status)
                    .to.eq(availability.available_copies > 0 ? 'available' : 'unavailable')
            })
        })

        it('CT-12 - Não deve consultar livro inexistente (404)', () => {
            cy.request({
                method: 'GET',
                url: `${LIVROS}/${ID_INEXISTENTE}`,
                failOnStatusCode: false
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code 404 (não encontrado)').to.eq(404)
                expect(response.body.message, 'mensagem de negócio').to.contain('não encontrado')
                expect(response.body.bookId).to.eq(ID_INEXISTENTE)
                expect(response.body, 'nenhum dado de livro é retornado').to.not.have.property('book')
            })
        })

        it('CT-13 - Não deve consultar livro com ID inválido (400)', () => {
            cy.request({
                method: 'GET',
                url: `${LIVROS}/${ID_INVALIDO}`,
                failOnStatusCode: false
            }).then((response) => {
                validacoesGlobais(response)
                // Regra de negócio: entrada inválida não retorna 500
                expect(response.status, 'status code 400 (requisição inválida)').to.eq(400)
                expect(response.body.message, 'mensagem indica ID inválido').to.contain('inválido')
                expect(response.body.providedId, 'ecoa o valor recebido').to.eq(ID_INVALIDO)
            })
        })
    })

    describe('3. Catálogo - Cadastro (POST)', () => {

        it('CT-14 - Deve cadastrar um novo livro como admin (201)', () => {
            // Título único a cada execução, para a suíte poder rodar quantas
            // vezes for preciso sem esbarrar na regra de duplicidade.
            livroTitulo = `Testes de API na Prática ${Date.now()}`

            cy.request({
                method: 'POST',
                url: LIVROS,
                headers: { Authorization: tokenAdmin },
                body: {
                    ...livroBase,
                    title: livroTitulo,
                    author: livroAutor
                }
            }).then((response) => {
                validacoesGlobais(response)
                const { book } = response.body

                expect(response.status, 'status code 201 (recurso criado)').to.eq(201)
                expect(response.body.message).to.contain('sucesso')
                expect(book.id, 'livro retornado com ID').to.be.a('number')

                // Os dados persistidos conferem com o enviado
                expect(book.title).to.eq(livroTitulo)
                expect(book.author).to.eq(livroAutor)
                expect(book.total_copies).to.eq(livroBase.total_copies)

                // Regra de negócio: livro novo entra com todos os exemplares disponíveis
                expect(book.available_copies, 'disponíveis = total no cadastro').to.eq(book.total_copies)

                // ID usado para editar e excluir o livro nos próximos cenários
                livroId = book.id
            })
        })

        it('CT-15 - Não deve cadastrar livro duplicado (400)', () => {
            cy.request({
                method: 'POST',
                url: LIVROS,
                headers: { Authorization: tokenAdmin },
                failOnStatusCode: false,
                body: {
                    ...livroBase,
                    title: livroTitulo,
                    author: livroAutor
                }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code 400 (regra de duplicidade)').to.eq(400)
                // Regra de negócio: não existem dois livros com o mesmo título e autor
                expect(response.body.message).to.contain('Já existe um livro')
                expect(response.body.existingBook.id, 'aponta o livro já existente').to.eq(livroId)
            })
        })

        it('CT-16 - Não deve cadastrar livro sem o campo title (400)', () => {
            cy.request({
                method: 'POST',
                url: LIVROS,
                headers: { Authorization: tokenAdmin },
                failOnStatusCode: false,
                body: {
                    author: 'Autor Sem Título',
                    category: 'Tecnologia',
                    total_copies: 2
                }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code 400 (payload inválido)').to.eq(400)
                expect(response.body.field, 'campo obrigatório ausente').to.eq('title')
                expect(response.body.message).to.contain('title')
            })

            // Regra de negócio: nenhum livro é criado quando o payload é inválido
            cy.request({
                method: 'GET',
                url: LIVROS,
                qs: { search: 'Autor Sem Título' }
            }).then((consulta) => {
                validacoesGlobais(consulta)
                expect(consulta.body.books, 'nada foi criado').to.be.empty
            })
        })

        it('CT-17 - Não deve cadastrar livro com format inválido (400)', () => {
            cy.request({
                method: 'POST',
                url: LIVROS,
                headers: { Authorization: tokenAdmin },
                failOnStatusCode: false,
                body: {
                    title: 'Livro com Formato Inválido',
                    author: livroAutor,
                    format: 'Pergaminho',
                    total_copies: 1
                }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code').to.eq(400)
                // Regra de negócio: format restrito a Físico, Digital ou Audiobook
                expect(response.body.field).to.eq('format')
                expect(response.body.message).to.contain('format')
            })
        })

        it('CT-18 - Não deve cadastrar livro com ano de publicação futuro (400)', () => {
            cy.request({
                method: 'POST',
                url: LIVROS,
                headers: { Authorization: tokenAdmin },
                failOnStatusCode: false,
                body: {
                    title: 'Livro do Futuro',
                    author: livroAutor,
                    publication_year: 2999,
                    total_copies: 1
                }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code').to.eq(400)
                // Regra de negócio: ano de publicação não pode ultrapassar o ano atual
                expect(response.body.field).to.eq('publication_year')
                expect(response.body.message).to.contain(String(new Date().getFullYear()))
            })
        })

        it('CT-19 - Não deve cadastrar livro sem token (401)', () => {
            cy.request({
                method: 'POST',
                url: LIVROS,
                failOnStatusCode: false,
                body: {
                    title: 'Livro Sem Autenticação',
                    author: 'Anônimo',
                    total_copies: 1
                }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code 401 (não autenticado)').to.eq(401)
                // Regra de negócio: token de acesso é obrigatório para cadastrar
                expect(response.body.error).to.eq('MISSING_TOKEN')
            })
        })

        it('CT-20 - Não deve cadastrar livro como usuário comum (403)', () => {
            cy.request({
                method: 'POST',
                url: LIVROS,
                headers: { Authorization: tokenUser },
                failOnStatusCode: false,
                body: {
                    title: 'Livro Criado por Usuário Comum',
                    author: 'Usuário Teste',
                    total_copies: 1
                }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code 403 (acesso negado)').to.eq(403)
                // Regra de negócio: apenas administradores cadastram livros
                expect(response.body.error).to.eq('ADMIN_REQUIRED')
                // Diferencia 403 de 401: o usuário está autenticado
                expect(response.body.requiredRole).to.eq('admin')
                expect(response.body.userRole).to.eq('user')
            })
        })
    })

    describe('4. Catálogo - Atualização (PUT)', () => {

        it('CT-21 - Deve atualizar o livro como admin (200)', () => {
            livroTituloEditado = `${livroTitulo} - 2a Edição Revisada`

            cy.request({
                method: 'PUT',
                url: `${LIVROS}/${livroId}`,
                headers: { Authorization: tokenAdmin },
                body: {
                    ...livroBase,
                    title: livroTituloEditado,
                    author: livroAutor,
                    pages: 400,
                    total_copies: 8,
                    available_copies: 8
                }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code').to.eq(200)
                expect(response.body.message).to.contain('sucesso')
                expect(response.body.bookId, 'ID atualizado').to.eq(livroId)
                expect(response.body.updatedFields, 'campos alterados').to.include('title')
                // Regra de negócio: o título anterior é o cadastrado no CT-14
                expect(response.body.previousTitle).to.eq(livroTitulo)
            })
        })

        it('CT-22 - Deve confirmar que a alteração foi persistida (200)', () => {
            cy.request({
                method: 'GET',
                url: `${LIVROS}/${livroId}`
            }).then((response) => {
                validacoesGlobais(response)
                const { book, availability } = response.body

                expect(response.status, 'status code').to.eq(200)
                // Regra de negócio: a alteração foi efetivamente persistida
                expect(book.title, 'título alterado').to.eq(livroTituloEditado)
                expect(book.pages).to.eq(400)
                expect(book.total_copies, 'novo estoque').to.eq(8)
                expect(book.available_copies).to.eq(8)
                // Regra de negócio: disponíveis continuam dentro do total do acervo
                expect(availability.available_copies).to.be.at.most(availability.total_copies)
            })
        })

        it('CT-23 - Não deve atualizar livro inexistente (404)', () => {
            cy.request({
                method: 'PUT',
                url: `${LIVROS}/${ID_INEXISTENTE}`,
                headers: { Authorization: tokenAdmin },
                failOnStatusCode: false,
                body: {
                    title: 'Livro Fantasma',
                    author: 'Ninguém',
                    total_copies: 1
                }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code').to.eq(404)
                // Regra de negócio: não atualiza livro que não existe no acervo
                expect(response.body.message).to.contain('não encontrado')
                expect(response.body.bookId).to.eq(ID_INEXISTENTE)
            })
        })

        it('CT-24 - Não deve atualizar livro sem o campo author (400)', () => {
            cy.request({
                method: 'PUT',
                url: `${LIVROS}/${livroId}`,
                headers: { Authorization: tokenAdmin },
                failOnStatusCode: false,
                body: {
                    title: 'Somente o título foi enviado'
                }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code').to.eq(400)
                expect(response.body.field, 'campo obrigatório ausente').to.eq('author')
                expect(response.body.message).to.contain('author')
            })

            // Regra de negócio: payload inválido não altera o registro
            cy.request({
                method: 'GET',
                url: `${LIVROS}/${livroId}`
            }).then((consulta) => {
                validacoesGlobais(consulta)
                expect(consulta.body.book.title, 'título segue o do CT-21').to.eq(livroTituloEditado)
            })
        })

        it('CT-25 - Não deve atualizar livro como usuário comum (403)', () => {
            cy.request({
                method: 'PUT',
                url: `${LIVROS}/${livroId}`,
                headers: { Authorization: tokenUser },
                failOnStatusCode: false,
                body: {
                    title: 'Alteração Indevida',
                    author: 'Usuário Teste',
                    total_copies: 1
                }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code').to.eq(403)
                // Regra de negócio: apenas administradores atualizam livros
                expect(response.body.error).to.eq('ADMIN_REQUIRED')
            })
        })
    })

    describe('5. Catálogo - Exclusão (DELETE)', () => {

        it('CT-26 - Não deve excluir livro sem token (401)', () => {
            cy.request({
                method: 'DELETE',
                url: `${LIVROS}/${livroId}`,
                failOnStatusCode: false
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code').to.eq(401)
                // Regra de negócio: token obrigatório para excluir do acervo
                expect(response.body.error).to.eq('MISSING_TOKEN')
            })
        })

        it('CT-27 - Não deve excluir livro como usuário comum (403)', () => {
            cy.request({
                method: 'DELETE',
                url: `${LIVROS}/${livroId}`,
                headers: { Authorization: tokenUser },
                failOnStatusCode: false
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code').to.eq(403)
                // Regra de negócio: apenas administradores excluem livros
                expect(response.body.error).to.eq('ADMIN_REQUIRED')
            })
        })

        it('CT-28 - Deve excluir o livro como admin (200)', () => {
            cy.request({
                method: 'DELETE',
                url: `${LIVROS}/${livroId}`,
                headers: { Authorization: tokenAdmin }
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code').to.eq(200)
                expect(response.body.message).to.contain('sucesso')
                // O livro excluído é exatamente o criado pelos testes
                expect(response.body.deletedBook.id).to.eq(livroId)
                expect(response.body.deletedBook.title).to.eq(livroTituloEditado)
            })
        })

        it('CT-29 - Deve confirmar que o livro foi excluído (404)', () => {
            cy.request({
                method: 'GET',
                url: `${LIVROS}/${livroId}`,
                failOnStatusCode: false
            }).then((response) => {
                validacoesGlobais(response)
                // Regra de negócio: livro excluído não é mais retornado pelo catálogo
                expect(response.status, 'status code').to.eq(404)
                expect(response.body.message).to.contain('não encontrado')
            })
        })

        it('CT-30 - Não deve excluir livro inexistente (404)', () => {
            cy.request({
                method: 'DELETE',
                url: `${LIVROS}/${ID_INEXISTENTE}`,
                headers: { Authorization: tokenAdmin },
                failOnStatusCode: false
            }).then((response) => {
                validacoesGlobais(response)
                expect(response.status, 'status code').to.eq(404)
                // Regra de negócio: exclusão de ID inexistente não retorna sucesso
                expect(response.body.message).to.contain('não encontrado')
            })
        })

        it('CT-31 - Não deve excluir livro com ID inválido (400)', () => {
            cy.request({
                method: 'DELETE',
                url: `${LIVROS}/${ID_INVALIDO}`,
                headers: { Authorization: tokenAdmin },
                failOnStatusCode: false
            }).then((response) => {
                validacoesGlobais(response)
                // Regra de negócio: entrada inválida não derruba a API (sem 500)
                expect(response.status, 'status code').to.eq(400)
                expect(response.body.message, 'mensagem indica ID inválido').to.contain('inválido')
            })
        })
    })
})
