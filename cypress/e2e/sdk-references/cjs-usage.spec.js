/// <reference types="cypress" />

describe.only('cjs-usage', () => {
    beforeEach(() => {
        cy.visit(`/sdk-references/cjs-usage/index.html`);
    });

    it(`haploid injected`, () => {
        cy.window().then(win => {
            expect(win.haploid).to.not.equal(undefined);
        });
    });
});
