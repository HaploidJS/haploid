/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('assets-json', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['various-entries']}`);
        cy.window().then(win => win.history.pushState(null, '', '/asset'));
    });

    it(`mounted successfully`, () => {
        cy.get('#app h1').should('have.text', 'asset mounted');
    });
});
