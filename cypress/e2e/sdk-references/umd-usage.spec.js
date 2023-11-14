/// <reference types="cypress" />

describe('umd-usage', () => {
    beforeEach(() => {
        cy.visit(`/sdk-references/umd-usage/index.html`);
    });

    it(`haploid injected`, () => {
        cy.window().then(win => {
            expect(win.haploid).to.not.equal(undefined);
        });
    });
});
