export function filterDOM(
    root: Node | null,
    shouldSkip: (node: Node) => boolean,
    filter: number = NodeFilter.SHOW_ELEMENT
): void {
    if (!root) {
        return;
    }

    if (root instanceof HTMLTemplateElement) {
        root = root.content;
    }

    const treeWalker = document.createTreeWalker(root, filter);

    let currentNode: Node | null = treeWalker.currentNode;

    const nodesToBeRemoved: Node[] = [];

    do {
        const skip = shouldSkip(currentNode);
        if (skip) {
            nodesToBeRemoved.push(currentNode);
            currentNode = treeWalker.nextSibling();
        } else {
            currentNode = treeWalker.nextNode();
        }
    } while (currentNode);

    nodesToBeRemoved.forEach(node => node.parentNode?.removeChild(node));
}
