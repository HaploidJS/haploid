/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('force-regexp', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['css-fix']}`);
        cy.window().then(win => win.history.pushState(null, '', '/force-regexp'));
    });

    it(`@charset is removed`, () => {
        cy.get('#app').find('haploid-head>style').should('contain.text', 'removed @charset');
    });

    it(`url() is fixed`, () => {
        cy.get('#app').find('haploid-head>style').should('contain.text', '/apps/new.png');
    });

    it(`comment is fix too`, () => {
        cy.get('#app').find('haploid-head>style').should('contain.text', 'old.png');
    });

    it(`var() is reserved`, () => {
        cy.get('#app').find('haploid-head>style').should('contain.text', 'var(');
    });
});
