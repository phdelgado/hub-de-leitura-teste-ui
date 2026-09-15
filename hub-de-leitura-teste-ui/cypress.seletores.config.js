// Config da aula de seletores: página estática local, não precisa do app em localhost:3000
const config = require("./cypress.config");

module.exports = {
  ...config,
  e2e: {
    ...config.e2e,
    baseUrl: null,
    specPattern: "cypress/e2e/seletores/**/*.cy.js",
  },
};
