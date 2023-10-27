/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('js-entry', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['various-entries']}`);
        cy.window().then(win => win.history.pushState(null, '', '/bar'));
    });

    it(`mounted successfully`, () => {
        cy.get('#app h1').should('have.text', 'bar mounted');
    });
});
