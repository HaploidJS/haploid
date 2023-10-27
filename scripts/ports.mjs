let basePort = 10810;

export const ports = {
    'umd-usage': basePort++,
    'esm-usage': basePort++,
    'cjs-usage': basePort++,
    'systemjs-usage': basePort++,
    'fallback-url': basePort++,
    'various-entries': basePort++,
    'keep-alive': basePort++,
    'wrapper-dom': basePort++,
    sandbox: basePort++,
    'preserve-html': basePort++,
    'css-fix': basePort++,
};

export const servers = Object.keys(ports);
