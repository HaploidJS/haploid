import { filterDOM } from '@/utils/filterDOM';

describe.only('filterDOM', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div><script>;</script><div><img src="about:blank"/></div></div>';
    });

    it('walk <template>', async () => {
        const tpl = document.createElement('template');
        tpl.innerHTML = `<ul></ul><div><a></a><i></i></div>`;
        filterDOM(tpl, (node: Node) => node.nodeName.toLowerCase() === 'a');
        expect(tpl.content.querySelectorAll('*')).toHaveLength(3);
    });

    it(`skip specified tags`, async () => {
        expect(document.body.querySelectorAll('script,img')).toHaveLength(2);

        filterDOM(document.body, (node: Node) => {
            if (/(script|img)/i.test(node.nodeName)) {
                return true;
            }

            return false;
        });

        expect(document.body.querySelectorAll('script,img')).toHaveLength(0);
    });
});
