/// <reference types="cypress" />
import { faker } from '@faker-js/faker';
import cadastroPage from '../support/pages/cadastro-pages';


describe('Funcionalidade: Cadastro e Login no Hub de Leitura', () => {

    beforeEach(() => {
        cadastroPage.visitarPaginaCadastro()
    })

    it('Deve cadastrar um novo usuário e fazer login com os dados gerados', () => {
        let nome = faker.person.fullName()
        let email = `${faker.internet.username()}.${Date.now()}@teste.com`.toLowerCase()
        let telefone = '11999999999'
        let senha = faker.internet.password({ length: 10 })

        cadastroPage.preencherCadastro(nome, email, telefone, senha, senha)
        cy.url({ timeout: 10000 }).should('include', 'dashboard')

        // O cadastro já faz login automático; limpar a sessão garante que o login abaixo é real
        cy.clearLocalStorage()
        cy.visit('login.html')
        cy.login(email, senha)
        cy.get('#user-name').should('contain', nome)
    });

});
