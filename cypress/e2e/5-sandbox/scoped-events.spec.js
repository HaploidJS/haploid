/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('scoped-events', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['sandbox']}`);
        cy.window().then(win => win.history.pushState(null, '', '/scoped-events'));
    });

    it(`capturing and bubbling phases`, () => {
        cy.get('#fire-phase-event').click();
        cy.get('#phase-result').should('have.text', 'true');
    });
});
