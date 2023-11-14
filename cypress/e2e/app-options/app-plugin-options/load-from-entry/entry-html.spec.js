/// <reference types="cypress" />

describe.only('entry-html', () => {
    beforeEach(() => {
        cy.visit(`/app-options/app-plugin-options/load-from-entry/various-entries/index.html`);
        cy.window().then(win => win.history.pushState(null, '', '#/entry-html'));
    });

    it(`mounted successfully(entry found)`, () => {
        cy.get('#app h1').should('have.text', 'entry-html mounted');
    });

    it(`retrieve inline <style>, but ignore illegal ones`, () => {
        cy.get('#foo').should($foo => {
            const fontSize = parseInt(window.getComputedStyle($foo[0], null)['font-size'], 10);
            expect(fontSize).to.eq(12);
        });
    });

    it(`evalate scripts in order of normal->defer`, () => {
        // before latter defer
        cy.get('#foo strong').should('have.text', '1');
        // final defer
        return cy
            .window()
            .then(win => new Promise(re => setTimeout(re, 300, win)))
            .then(win => {
                expect(win.count).to.eq(2);
            });
    });

    it(`retrieve external <link>, but ignore illegal ones`, () => {
        cy.get('#foo').should($foo => {
            const padding = parseInt(window.getComputedStyle($foo[0], null)['padding-left'], 10);
            expect(padding).to.eq(15);
        });
    });
});
