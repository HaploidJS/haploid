/// <reference types="cypress" />

describe.only('systemjs-usage', () => {
    beforeEach(() => {
        cy.visit(`/sdk-references/systemjs-usage/index.html`);
    });

    it(`haploid injected`, () => {
        cy.window().then(win => {
            expect(win.haploid).to.not.equal(undefined);
        });
    });
});
