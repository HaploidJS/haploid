import { defineConfig } from 'cypress';

export default defineConfig({
    projectId: '1ntrqi',
    e2e: {
        specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    },
});
