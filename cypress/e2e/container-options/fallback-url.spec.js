/// <reference types="cypress" />

describe.only('fallback-url', () => {
    beforeEach(() => {
        cy.visit(`/container-options/fallback-url/index.html#/`);
    });

    it(`fallback only at #/`, () => {
        cy.window().then(win => {
            cy.location('hash')
                .should('eq', '#/foo')
                .then(() => cy.get('#app').should('have.text', 'foo mounted'))
                .then(() => win.history.pushState(null, '', '#/bar'))
                .then(() => cy.location('hash').should('eq', '#/bar'))
                .then(() => cy.get('#app').children().should('have.length', 0));
        });
    });
});
