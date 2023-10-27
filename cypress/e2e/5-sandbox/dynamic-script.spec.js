/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('env', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['sandbox']}`);
        cy.window().then(win => win.history.pushState(null, '', '/dynamic-script'));
    });

    it('dynamic script can fire load and error events(load still fired even evaluating failed)', () => {
        cy.get('.scriptEvents').should('contain.text', '1load/1load/2error/2error/3load');
    });

    it('dynamic script can read document.currentScript correctly', () => {
        cy.get('.currentScript').should('contain.text', 'true');
    });
});
