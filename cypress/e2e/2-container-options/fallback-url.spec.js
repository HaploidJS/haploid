/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('fallback-url', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['fallback-url']}`);
    });

    it(`fallback only at /`, () => {
        cy.window().then(win => {
            cy.location('pathname')
                .should('eq', '/foo')
                .then(() => cy.get('#app').should('have.text', 'foo mounted'))
                .then(() => win.history.pushState(null, '', '/bar'))
                .then(() => cy.location('pathname').should('eq', '/bar'))
                .then(() => cy.get('#app').children().should('have.length', 0));
        });
    });
});
