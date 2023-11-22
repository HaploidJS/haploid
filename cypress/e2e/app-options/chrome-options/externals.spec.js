/// <reference types="cypress" />

describe.only('externals', () => {
    beforeEach(() => {
        cy.visit(`/app-options/chrome-options/externals/index.html`);
        cy.window().then(win => win.history.pushState(null, '', '#/var'));
    });

    it(`get markExternal from container`, () => {
        cy.get('.var-external').should('have.text', 'external:789');
    });
});
