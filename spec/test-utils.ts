import less from 'less';

export async function compressCSS(input: string): Promise<string> {
    const { css } = await less.render(input, {
        compress: true,
    });

    return css;
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms)).then(() => undefined);
}

export function createRoot(id: string): HTMLDivElement {
    const div = document.createElement('div');
    div.id = id;
    document.body.append(div);
    return div;
}

export function removeRoot(ele: HTMLDivElement): void {
    ele.parentElement?.removeChild(ele);
}

export function uuid(): string {
    return `${((Math.random() * 1e7) | 0).toString(36)}`;
}
