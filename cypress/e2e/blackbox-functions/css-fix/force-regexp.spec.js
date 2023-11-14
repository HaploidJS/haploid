/// <reference types="cypress" />

describe.only('force-regexp', () => {
    beforeEach(() => {
        cy.visit(`/blackbox-functions/css-fix/index.html`);
        cy.window().then(win => win.history.pushState(null, '', '#/force-regexp'));
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
