/// <reference types="cypress" />

describe.only('entry-js-esm', () => {
    beforeEach(() => {
        cy.visit(`/app-options/app-plugin-options/load-from-entry/various-entries/index.html`);
        cy.window().then(win => win.history.pushState(null, '', '#/entry-js-esm'));
    });

    it(`mounted successfully`, () => {
        cy.get('#app h1').should('have.text', 'entry-js-esm mounted');
    });
});
