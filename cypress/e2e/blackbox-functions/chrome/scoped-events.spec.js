/// <reference types="cypress" />

describe.only('scoped-events', () => {
    beforeEach(() => {
        cy.visit(`/blackbox-functions/chrome/index.html`);
        cy.window().then(win => win.history.pushState(null, '', '#/scoped-events'));
    });

    it(`capturing and bubbling phases`, () => {
        cy.get('#fire-phase-event').click();
        cy.get('#phase-result').should('have.text', 'true');
    });
});
