///<reference types="cypress" />

let token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBiaWJsaW90ZWNhLmNvbSIsImlzQWRtaW4iOnRydWUsImlhdCI6MTc5MDA5MjU0MywiZXhwIjoxNzkwMTIxMzQzfQ.M39HgnK8Mc3rjb39NG9Q9A3muaYux6D48KB8eZmd-Qo'

describe('GET - Teste de API - Gestão de Usuários', () => {

    it('Deve listar usuários com sucesso', () => {
        cy.api({
            method: 'GET',
            url: 'users',
            headers: { 'Authorization': token }
        }).should((response) => {
            expect(response.status).eq(200)
            expect(response.body.users).to.be.an('array')
        })
    });

    it('Deve validar propriedades de um usuário', () => {
        cy.api({
            method: 'GET',
            url: 'users/1',
            headers: { 'Authorization': token }
        }).should((response) => {
            expect(response.status).eq(200)
            expect(response.body).to.have.property('id')
            expect(response.body).to.have.property('name')
            expect(response.body).to.have.property('email')
        })

    })

    it('Deve listar um usuario com sucesso buscando por ID', () => {
        cy.api({
            method: 'GET',
            url: 'users/2',
            headers: { 'Authorization': token }
        }).should((response) => {
            expect(response.status).eq(200)
            expect(response.body).to.have.property('id')
            expect(response.body).to.have.property('name')
            expect(response.body).to.have.property('email')
        })
    });

    it('Deve listar usuario com sucesso usando parametros', () => {
        cy.api({
            method: 'GET',
            url: 'users',
            headers: { 'Authorization': token },
            qs: {
                page: 2,
                limit: 5,
                search: 'Usuario'
            }
        }).should((response) => {
            expect(response.status).eq(200)
        })
    })

});

describe('POST - Teste de API - Gestão de Usuários', () => {

    it('Deve cadastrar um usuário com sucesso', () => {
        let email = `teste${Date.now()}@email.com`

        cy.api({
            method: 'POST',
            url: 'users',
            headers: { 'Authorization': token },
            body: {
                "name": "Maria Santos",
                "email": email,
                "password": "senha123"
            }
        }).should((response) => {
            expect(response.status).to.equal(201)
            expect(response.body.user.email).to.eq(email)
            expect(response.body.message).to.eq('Usuário criado com sucesso.')
        })
    });

});