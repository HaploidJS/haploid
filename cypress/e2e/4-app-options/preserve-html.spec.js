/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('preserve-html', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['preserve-html']}`);
    });

    it(`sync head&body html`, () => {
        cy.window().then(win => win.history.pushState(null, '', '/sync-app-html'));
        cy.get('.haploid-head').find('base').should('have.length', 0);
        cy.get('.haploid-head').find('link').should('have.length', 0);
        cy.get('.haploid-head').find('meta').should('have.length', 4);
        cy.get('.haploid-head').find('haploid-title').should('have.length', 1);
        cy.get('.haploid-head').find('haploid-title').should('have.text', 'sync-app-html title');
        cy.get('.haploid-head').find('script').should('have.length', 0);

        cy.get('.haploid-body').find('base').should('have.length', 0);
        cy.get('.haploid-body').find('#sync-app-html').should('have.length', 1);
        cy.get('.haploid-body').find('script').should('have.length', 0);
        cy.get('.haploid-body').find('footer').should('have.length', 1);
    });

    it(`preset-options-prefer`, () => {
        cy.window().then(win => win.history.pushState(null, '', '/preset-options-prefer'));
        cy.get('.haploid-head').find('meta[name="keywords"]').should('have.length', 1);
        cy.get('.haploid-head').find('haploid-title').should('have.text', 'override title');

        cy.get('.haploid-body').find('#preset-options-prefer').should('have.length', 1);
    });
});
