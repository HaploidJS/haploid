/// <reference types="cypress" />
import { ports } from '../../../scripts/ports.mjs';

describe.only('env', () => {
    beforeEach(() => {
        cy.visit(`http://localhost:${ports['sandbox']}`);
        cy.window().then(win => win.history.pushState(null, '', '/env'));
    });

    it(`all asserts passed`, () => {
        cy.get('.assert')
            .get('.answer')
            .each($el => {
                cy.get($el).should('contain.text', 'true');
            });
    });

    it(`visit and modify normal variables cannot escape from sandbox`, () => {
        cy.window().should('not.have.own.property', '__ENV_VAR__');
        cy.window().should('not.have.own.property', '__NEW_VALUE__');
        cy.window().should('not.have.own.property', '__NEW_GETTER__');
        cy.window().its('__GLOBAL_VAR__').should('equal', true);
    });

    it('visit and modify escape variable', () => {
        cy.get('#visit-escape').click();
        cy.get('#visit-escape').should('have.text', 'true');

        cy.window().its('__GLOBAL_ESCAPE_VAR__').should('equal', true);
    });

    it('document.write is noop', () => {
        cy.get('#document-write').click();

        expect(cy.get('#app')).to.not.equal(undefined);
    });

    it('document.writeln is noop', () => {
        cy.get('#document-writeln').click();

        expect(cy.get('#app')).to.not.equal(undefined);
    });

    it('document.open/close are noops', () => {
        cy.get('#document-open-close').click();

        expect(cy.get('#app')).to.not.equal(undefined);
    });

    it('document.replaceChildren is noop', () => {
        cy.get('#document-replace-children').click();

        expect(cy.get('#app')).to.not.equal(undefined);
    });

    it('document.getElementById is scoped', () => {
        cy.get('#get-element-by-id').click();

        cy.get('#get-element-by-id').should('have.text', 'true');
        cy.get('#fixture-id').should('have.length', 1);
    });

    it('document.getElementsByClassName is scoped', () => {
        cy.get('#get-element-by-class-name').click();

        cy.get('#get-element-by-class-name').should('have.text', '1/true');
        cy.get('.fixture-class').should('have.length', 2);
    });

    it('document.getElementsByTagName is scoped', () => {
        cy.get('#get-element-by-tag-name').click();

        cy.get('#get-element-by-tag-name').should('have.text', '1/true');
        cy.get('legend').should('have.length', 2);
    });

    it('document.getElementsByTagNameNS is scoped', () => {
        cy.get('#get-element-by-tag-name-ns').click();

        cy.get('#get-element-by-tag-name-ns').should('have.text', '1/true');
        cy.get('legend').should('have.length', 2);
    });

    it('document.querySelector is scoped', () => {
        cy.get('#query-selector').click();

        cy.get('#query-selector').should('have.text', 'true');
        cy.get('#fixture-id').should('have.length', 1);
    });

    it('document.querySelectorAll is scoped', () => {
        cy.get('#query-selector-all').click();

        cy.get('#query-selector-all').should('have.text', '1/true');
        cy.get('.fixture-class').should('have.length', 2);
    });

    it('document.createElement', () => {
        cy.get('#create-element').click();
        cy.get('#create-element').should('have.text', 'true');
    });

    it('document.createElementNS', () => {
        cy.get('#create-element-ns').click();
        cy.get('#create-element-ns').should('have.text', 'true');
    });

    it('document.createComment', () => {
        cy.get('#create-comment').click();
        cy.get('#create-comment').should('have.text', 'true');
    });

    it('document.createDocumentFragment', () => {
        cy.get('#create-document-fragment').click();
        cy.get('#create-document-fragment').should('have.text', 'true');
    });

    it('document.createAttribute', () => {
        cy.get('#create-attribute').click();
        cy.get('#create-attribute').should('have.text', 'true');
    });

    it('document.createAttributeNS', () => {
        cy.get('#create-attribute-ns').click();
        cy.get('#create-attribute-ns').should('have.text', 'true');
    });

    it('document.createTextNode', () => {
        cy.get('#create-text-node').click();
        cy.get('#create-text-node').should('have.text', 'true');
    });

    it('document.defaultView is window', () => {
        cy.get('#document-defaultView').click();
        cy.get('#document-defaultView').should('have.text', 'true');
    });

    it('document.documentElement is htmlElement', () => {
        cy.get('#document-documentElement').click();
        cy.get('#document-documentElement').should('have.text', 'true');
    });

    it('document.title', () => {
        cy.get('#document-title').click();
        cy.get('#document-title').should('have.text', 'true');
    });

    it('document.head is headElement', () => {
        cy.get('#document-head').click();
        cy.get('#document-head').should('have.text', 'true');
    });

    it('document.body is bodyElement', () => {
        cy.get('#document-body').click();
        cy.get('#document-body').should('have.text', 'true');
    });

    it('document.all includes all elements', () => {
        cy.get('#document-all').click();
        cy.get('#document-all').should('have.text', 'true');
    });

    it('document.forms includes all <form>', () => {
        cy.get('#document-forms').click();
        cy.get('#document-forms').should('have.text', 'true');
    });

    it('document.embeds includes all <embed>', () => {
        cy.get('#document-embeds').click();
        cy.get('#document-embeds').should('have.text', 'true');
    });

    it('document.plugins includes all <embed>', () => {
        cy.get('#document-plugins').click();
        cy.get('#document-plugins').should('have.text', 'true');
    });

    it('document.images includes all <img>', () => {
        cy.get('#document-images').click();
        cy.get('#document-images').should('have.text', 'true');
    });

    it('document.links includes all <a> and <area> with href attribute', () => {
        cy.get('#document-links').click();
        cy.get('#document-links').should('have.text', 'true');
    });

    it('document.scripts includes all <scripts>', () => {
        cy.get('#document-scripts').click();
        cy.get('#document-scripts').should('have.text', 'true');
    });

    it('document.children includes only htmlElement', () => {
        cy.get('#document-children').click();
        cy.get('#document-children').should('have.text', 'true');
    });

    it('document.childNodes includes only htmlElement', () => {
        cy.get('#document-childNodes').click();
        cy.get('#document-childNodes').should('have.text', 'true');
    });

    it('document.childElementCount is always 1', () => {
        cy.get('#document-childElementCount').click();
        cy.get('#document-childElementCount').should('have.text', 'true');
    });

    it('document.firstElementChild is htmlElement', () => {
        cy.get('#document-firstElementChild').click();
        cy.get('#document-firstElementChild').should('have.text', 'true');
    });

    it('document.lastElementChild is htmlElement', () => {
        cy.get('#document-lastElementChild').click();
        cy.get('#document-lastElementChild').should('have.text', 'true');
    });

    it('document.baseURI', () => {
        cy.get('#document-baseURI').click();
        cy.get('#document-baseURI').should('have.text', 'true');
    });

    it('document.dir', () => {
        cy.get('#document-dir').click();
        cy.get('#document-dir').should('have.text', 'true');
        cy.document().its('dir').should('equal', 'ltr');
    });

    it('document.hidden', () => {
        cy.get('#document-hidden').click();
        cy.get('#document-hidden').should('have.text', 'false');
    });

    it('document.visibilityState', () => {
        cy.get('#document-visibility-state').click();
        cy.get('#document-visibility-state').should('have.text', 'true');
    });
});
