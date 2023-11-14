/// <reference types="cypress" />

describe.only('env', () => {
    beforeEach(() => {
        cy.visit(`/blackbox-functions/chrome/index.html`);
        cy.window().then(win => win.history.pushState(null, '', '#/dynamic-link'));
    });

    it('dynamic link can fire load and error events(load still fired even evaluating failed)', () => {
        cy.get('.linkEvents').should('contain.text', '1load/1load/2error/2error/3load');
    });
    it('dynamic link has next sibling that contains its css', () => {
        cy.get('.nextSibling').should('contain.text', 'true');
    });
});
