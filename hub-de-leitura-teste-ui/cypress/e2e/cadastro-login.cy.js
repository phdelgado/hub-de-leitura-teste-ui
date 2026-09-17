/// <reference types="cypress" />
import { faker } from '@faker-js/faker';
import cadastroPage from '../support/pages/cadastro-pages';


describe('Funcionalidade: Cadastro e Login no Hub de Leitura', () => {

    it('Deve cadastrar um novo usuário e fazer login com os dados gerados', () => {
        // 1. Massa de dados gerada com Faker (timestamp garante e-mail único a cada execução)
        let nome = faker.person.fullName()
        let email = `${faker.internet.username()}.${Date.now()}@teste.com`.toLowerCase()
        let telefone = '11999999999'
        let senha = faker.internet.password({ length: 10 })

        // 2. Cadastro do usuário - reaproveitando o page object
        cadastroPage.visitarPaginaCadastro()
        cadastroPage.preencherCadastro(nome, email, telefone, senha, senha)
        cy.url({ timeout: 10000 }).should('include', 'dashboard')

        // 3. O cadastro já faz login automático, então encerramos a sessão
        // para que o login seja realmente exercitado pelo teste
        cy.clearLocalStorage()
        cy.visit('login.html')

        // 4. Login com o mesmo e-mail e senha - reaproveitando o comando personalizado
        cy.login(email, senha)

        // 5. Assertion de que o login foi realizado com sucesso
        cy.get('#user-name').should('contain', nome)
    });

});
