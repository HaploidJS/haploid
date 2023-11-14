/// <reference types="cypress" />

describe.only('entry-json', () => {
    beforeEach(() => {
        cy.visit(`/app-options/app-plugin-options/load-from-entry/various-entries/index.html`);
        cy.window().then(win => win.history.pushState(null, '', '#/baz'));
    });

    it(`mounted successfully`, () => {
        cy.get('#app h1').should('have.text', 'baz mounted');
    });
});
