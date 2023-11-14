/// <reference types="cypress" />

describe.only('with-external', () => {
    beforeEach(() => {
        cy.visit(`/additional-usage/with-external/index.html`);
        cy.window().then(win => win.history.pushState(null, '', '#/var'));
    });

    it(`get markExternal from container`, () => {
        cy.get('.var-external').should('have.text', 'get external module from var');
    });
});
