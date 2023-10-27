// Respect to single-spa.

export function parseUri(str: string): HTMLAnchorElement {
    const anchor: HTMLAnchorElement = document.createElement('a');
    anchor.href = str;
    return anchor;
}

export function navigateToUrl(url: string): void {
    const current = parseUri(window.location.href);
    const destination = parseUri(url);

    if (url.indexOf('#') === 0) {
        window.location.hash = destination.hash;
    } else if (current.host !== destination.host && destination.host) {
        window.location.href = url;
    } else if (destination.pathname === current.pathname && destination.search === current.search) {
        window.location.hash = destination.hash;
    } else {
        // different path, host, or query params
        window.history.pushState(null, '', url);
    }
}
