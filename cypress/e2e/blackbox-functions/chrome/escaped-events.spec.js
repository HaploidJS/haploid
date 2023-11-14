/// <reference types="cypress" />

describe.only('escaped-events', () => {
    beforeEach(() => {
        cy.visit(`/blackbox-functions/chrome/index.html`);
        cy.window().then(win => win.history.pushState(null, '', '#/escaped-events'));
    });

    it(`escaped events fired`, () => {
        let count = 0;
        cy.window()
            .then(win => {
                win.addEventListener('escaped-event', () => {
                    count += 1;
                });
                win.document.addEventListener('escaped-event', () => {
                    count += 1;
                });
            })
            .then(() => {
                cy.get('#fire-escaped').click();
                cy.get('#events-count').should('have.text', '4');
            })
            .then(() => {
                cy.wrap(count).should('eq', 2);
            });
    });
});
