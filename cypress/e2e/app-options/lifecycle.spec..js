/// <reference types="cypress" />

describe.only('lifecycle', () => {
    beforeEach(() => {
        cy.visit(`/app-options/app-plugin-options/load-from-entry/various-entries/index.html`);
        cy.window().then(win => win.history.pushState(null, '', '#/lf'));
    });

    it(`mounted successfully`, () => {
        cy.get('#app h1').should('have.text', 'lf mounted');
    });
});
