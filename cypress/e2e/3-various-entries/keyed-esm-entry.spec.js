/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('keyed-esm-entry', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['various-entries']}`);
        cy.window().then(win => win.history.pushState(null, '', '/keyed-esm'));
    });

    it(`mounted successfully`, () => {
        cy.get('#app h1').should('have.text', 'keyed-esm mounted');
    });
});
