/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('wrapper-dom', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['wrapper-dom']}`);
    });

    it(`default domWrapper is <div>`, () => {
        cy.window().then(win => win.history.pushState(null, '', '/default-wrapper'));
        cy.get('.haploid-body').children('div').should('have.length', 1);
    });

    it(`all elements are kept`, () => {
        cy.window().then(win => win.history.pushState(null, '', '/mutiple-elements'));
        cy.get('.haploid-body').children('div').should('have.length', 2);
    });

    it(`use default <div> is no element found`, () => {
        cy.window().then(win => win.history.pushState(null, '', '/no-elements'));
        cy.get('.haploid-body').children('div').should('have.length', 1);
    });

    it(`unknown element is supported`, () => {
        cy.get('textarea').type(`<abcd></abcd>`);
        cy.get('button[type=submit]').click();
        // no error
        cy.get('p.error').should('have.text', '');
    });

    it(`filter tags(script/body/html/head/title/base) and properties(contenteditable/on*)`, () => {
        cy.window().then(win => win.history.pushState(null, '', '/filter-tags'));
        cy.get('.haploid-body').should('not.have.descendants', 'script');
        cy.get('.haploid-body').should('not.have.descendants', 'body');
        cy.get('.haploid-body').should('not.have.descendants', 'html');
        cy.get('.haploid-body').should('not.have.descendants', 'head');
        cy.get('.haploid-body').should('not.have.descendants', 'title');
        cy.get('.haploid-body').should('not.have.descendants', 'base');

        cy.get('.haploid-body').should('have.descendants', 'p.content');
        cy.get('.haploid-body').should('not.have.descendants', '[contenteditable]');
        cy.get('.haploid-body').should('not.have.descendants', '[onclick]');
    });

    it(`add haploid-app-root class`, () => {
        cy.window().then(win => win.history.pushState(null, '', '/filter-tags'));
        cy.get('.haploid-html').should('have.attr', 'data-haploid-app');
        cy.get('.haploid-body').should('have.descendants', 'p.content.haploid-app-root');
    });
});
