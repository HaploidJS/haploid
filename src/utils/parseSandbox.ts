import type { Sandbox } from '../Def';

export function parseSandbox(sandbox?: Sandbox): Exclude<Sandbox, boolean> | undefined {
    if ('boolean' === typeof sandbox) {
        return sandbox ? {} : undefined;
    }

    return sandbox;
}
