/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('fix-url', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['css-fix']}`);
        cy.window().then(win => win.history.pushState(null, '', '/fix-url'));
    });

    it(`@charset is removed`, () => {
        cy.get('#app').find('haploid-head>style').should('not.contain.text', '@charset');
    });

    it(`url() is fixed`, () => {
        cy.get('#app').find('haploid-head>style').should('contain.text', '/apps/new.png');
    });

    it(`comment is discarded`, () => {
        cy.get('#app').find('haploid-head>style').should('not.contain.text', 'old.png');
    });

    it(`var() is discarded`, () => {
        cy.get('#app').find('haploid-head>style').should('not.contain.text', 'var(');
    });
});
