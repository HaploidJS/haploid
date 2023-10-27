/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('systemjs-usage', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['systemjs-usage']}`);
    });

    it(`haploid injected`, () => {
        cy.window().then(win => {
            expect(win.haploid).to.not.equal(undefined);
        });
    });
});
