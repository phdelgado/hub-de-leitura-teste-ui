/// <reference types="cypress" />
import { faker } from '@faker-js/faker';
import cadastroPage from '../support/pages/cadastro-pages';


describe('Funcionalidade: Cadastro no Hub de Leitura', () => {

    beforeEach(() => {
        cadastroPage.visitarPaginaCadastro()
    })

    it('Deve fazer cadastro com sucesso, usando função JS', () => {
        let email = `pedro${Date.now()}@teste.com`
        cy.get('#name').type('Pedro')
        cy.get('#email').type(email)
        cy.get('#phone').type('11999999999')
        cy.get('#password').type('senha123')
        cy.get('#confirm-password').type('senha123')
        cy.get('#terms-agreement').check()
        cy.get('#register-btn').click()
        cy.url().should('include', 'dashboard')
    });

    it('Deve fazer cadastro com sucesso, usando Faker', () => {
        let nome = faker.person.fullName()
        let email = faker.internet.email()
        cy.get('#name').type(nome)
        cy.get('#email').type(email)
        cy.get('#phone').type('11999999999')
        cy.get('#password').type('senha123')
        cy.get('#confirm-password').type('senha123')
        cy.get('#terms-agreement').check()
        cy.get('#register-btn').click()
        cy.url().should('include', 'dashboard')
        cy.get('#user-name').should('contain', nome)
    });

    it('Deve preencher cadastro com sucesso - Usando comando personalizado', () => {
        let email = `pedro${Date.now()}@teste.com`
        let nome = faker.person.fullName({ sex: 'male' })
        cy.preencherCadastro(nome, email, '11999999999', 'senha123', 'senha123')
        cy.url().should('include', 'dashboard')
    });

    it('Deve preencher cadastro com sucesso - Usando page objects', () => {
        cadastroPage.preencherCadastro('Pedro', `pedro${Date.now()}@teste.com`, '11999999999', 'senha123', 'senha123')
        cy.url().should('include', 'dashboard')
    });

    it('Deve validar mensagem de erro ao tentar cadastrar com dados inválidos', () => {
        cadastroPage.preencherCadastro('', `pedro${Date.now()}@teste.com`, '11999999999', 'senha123', 'senha123')
        cy.get(':nth-child(1) > .invalid-feedback').should('contain', 'Nome deve ter pelo menos 2 caracteres')
    });




});