/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('cjs-usage', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['cjs-usage']}`);
    });

    it(`haploid injected`, () => {
        cy.window().then(win => {
            expect(win.haploid).to.not.equal(undefined);
        });
    });
});
