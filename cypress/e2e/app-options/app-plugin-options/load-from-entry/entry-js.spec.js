/// <reference types="cypress" />

describe.only('entry-js', () => {
    beforeEach(() => {
        cy.visit(`/app-options/app-plugin-options/load-from-entry/various-entries/index.html`);
        cy.window().then(win => win.history.pushState(null, '', '#/bar'));
    });

    it(`mounted successfully`, () => {
        cy.get('#app h1').should('have.text', 'bar mounted');
    });
});
