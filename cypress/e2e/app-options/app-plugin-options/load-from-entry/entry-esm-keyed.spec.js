/// <reference types="cypress" />

describe.only('entry-esm-keyed', () => {
    beforeEach(() => {
        cy.visit(`/app-options/app-plugin-options/load-from-entry/various-entries/index.html`);
        cy.window().then(win => win.history.pushState(null, '', '#/keyed-esm'));
    });

    it(`mounted successfully`, () => {
        cy.get('#app h1').should('have.text', 'keyed-esm mounted');
    });
});
