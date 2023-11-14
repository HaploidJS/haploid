import { defineConfig } from 'cypress';

export default defineConfig({
    projectId: '1ntrqi',
    e2e: {
        baseUrl: `http://localhost:10810/`,
        specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
        experimentalRunAllSpecs: true,
    },
});
