/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe('umd-usage', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['umd-usage']}`);
    });

    it(`haploid injected`, () => {
        cy.window().then(win => {
            expect(win.haploid).to.not.equal(undefined);
        });
    });
});
