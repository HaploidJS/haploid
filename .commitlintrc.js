module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'subject-empty': [2, 'never'],
        'subject-min-length': [2, 'always', 10],
        'header-max-length': [0, 'always', 200],
        'type-empty': [2, 'never'],
        'type-enum': [
            2,
            'always',
            ['release', 'perf', 'ci', 'feat', 'fix', 'docs', 'style', 'refactor', 'test', 'revert', 'chore'],
        ],
    },
};
