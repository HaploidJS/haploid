/// <reference types="cypress" />

describe.only('entry-assetmap-esm', () => {
    beforeEach(() => {
        cy.visit(`/app-options/app-plugin-options/load-from-entry/various-entries/index.html`);
        cy.window().then(win => win.history.pushState(null, '', '#/entry-assetmap-esm'));
    });

    it(`mounted successfully`, () => {
        cy.get('#app h1').should('have.text', 'entry-assetmap-esm mounted');
    });
});
