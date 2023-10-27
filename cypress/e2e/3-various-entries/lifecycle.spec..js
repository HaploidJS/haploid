/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('lifecycle', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['various-entries']}`);
        cy.window().then(win => win.history.pushState(null, '', '/lf'));
    });

    it(`mounted successfully`, () => {
        cy.get('#app h1').should('have.text', 'lf mounted');
    });
});
