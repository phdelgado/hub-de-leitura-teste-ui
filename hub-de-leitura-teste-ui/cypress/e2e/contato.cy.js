describe('funcionalidade: contato', () => {


beforeEach(() => {
cy.visit('index.html')
});

  it('deve preencher formulario de contato com sucesso', () => {

  cy.get('#name').type('Pedro')
  cy.get('#email').type('pedro@teste.com')
  cy.get('#subject').select('Sugestões')
  cy.get('#message').type('Teste de sugestão')
  cy.get('#btn-submit').click()
  cy.contains('Contato enviado com sucesso!').should('exist')
  })


  it("deve validar mensagem de erro ao enviar sem preencher nome", () => {

  cy.get('#name').clear()
  cy.get('#email').type('pedro@teste.com')
  cy.get('#subject').select('Sugestões')
  cy.get('#message').type('Teste de sugestão')
  cy.get('#btn-submit').click()
  cy.get('#alert-container').should('contain', 'Por favor, preencha o campo Nome')
  });

  it("deve validar mensagem de erro ao enviar sem preencher email", () => {
  
  cy.get('#name').type('Pedro')
  cy.get('#email').clear()
  cy.get('#subject').select('Sugestões')
  cy.get('#message').type('Teste de sugestão')
  cy.get('#btn-submit').click()
  cy.get('#alert-container').should('contain', 'Por favor, preencha o campo E-mail')
  });

  it("deve validar mensagem de erro ao enviar sem selecionar o assunto", () => {

  cy.get('#name').type('Pedro')
  cy.get('#email').type('pedro@teste.com')
  // cy.get('#subject').select('Sugestões')
  cy.get('#message').type('Teste de sugestão')
  cy.get('#btn-submit').click()
  cy.get('#alert-container').should('contain', 'Por favor, selecione o Assunto')
  });

  it("deve validar mensagem de erro ao enviar sem preencher a mensagem", () => {
   
  cy.get('#name').type('Pedro')
  cy.get('#email').type('pedro@teste.com')
  cy.get('#subject').select('Sugestões')
  //cy.get('#message').type('Teste de sugestão')
  cy.get('#btn-submit').click()
  cy.get('#alert-container').should('contain', 'Por favor, escreva sua Mensagem')
  })

  it("Deve validar mensagem de erro ao enviar sem preencher nome", () => {
  cy.get('#name').clear
  cy.get('#email').type('pedro@teste.com')
  cy.get('#subject').select('Sugestões')
  cy.get('#message').type('Teste de sugestão')
  cy.get('#btn-submit').click()
  cy.get('#alert-container').should('contain', 'Por favor, preencha o campo Nome')
  });

  it("deve validar mensagem de erro ao enviar sem preencher email", () => {
  cy.get('#name').type('Pedro')
  cy.get('#email').clear()
  cy.get('#subject').select('Sugestões')
  cy.get('#message').type('Teste de sugestão')
  cy.get('#btn-submit').click()
  cy.get('#alert-container').should('contain', 'Por favor, preencha o campo E-mail')
  });

  it("deve validar mensagem de erro ao enviar sem selecionar o assunto", () => {
  cy.get('#name').type('Pedro')
  cy.get('#email').type('pedro@teste.com')
  //cy.get('#subject').select('Sugestões')
  cy.get('#message').type('Teste de sugestão')
  cy.get('#btn-submit').click()
  cy.get('#alert-container').should('contain', 'Por favor, selecione o Assunto')
  
  });

  it.only("deve validar mensagem de erro ao enviar sem selecionar o assunto", () => {
  cy.get('#name').type('Pedro')
  cy.get('#email').type('pedro@teste.com')
  cy.get('#subject').select('Sugestões')
  cy.get('#message').clear()
  cy.get('#btn-submit').click()
  cy.get('#alert-container').should('contain', 'Por favor, escreva sua Mensagem')

  });

  













})