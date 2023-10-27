/// <reference types="cypress" />

import { ports } from '../../../scripts/ports.mjs';

describe.only('esm-usage', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['esm-usage']}`);
    });

    it(`haploid imported`, () => {
        cy.window().then(win => {
            expect(win.haploid).to.not.equal(undefined);
        });
    });
});
