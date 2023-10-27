/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('fallback-url', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['keep-alive']}`);
    });

    it(`keep-alive app does not unmount until container is destroyed`, async () => {
        cy.get('#activate-foo').click();
        cy.get('#activate-bar').click();
        cy.get('.bar').should('have.text', 'mounted');
        cy.get('#app').children().should('have.length', 2);
        cy.get('#app').children(':first-child').should('have.class', 'test-hidden');
        cy.get('#app').children(':first-child').should('have.attribute', 'hidden');
        cy.window().then(win => {
            expect(win['foo-mounted']).to.equals(true);
        });

        // re-activate foo again
        cy.get('#activate-foo').click();
        cy.get('.foo').should('have.text', 'mounted');
        cy.get('#app').children().should('have.length', 1); // bar is removed

        cy.get('#destroy').click();
        cy.window().then(win => {
            expect(win['foo-mounted']).to.equals(undefined);
        });
        cy.get('#app').children().should('have.length', 0);
    });
});
