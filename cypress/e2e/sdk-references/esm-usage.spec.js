/// <reference types="cypress" />

describe.only('esm-usage', () => {
    beforeEach(() => {
        cy.visit(`/sdk-references/esm-usage/index.html`);
    });

    it(`haploid imported`, () => {
        cy.window().then(win => {
            expect(win.haploid).to.not.equal(undefined);
        });
    });
});
