require('systemjs');

System.import('./haploid.system.dev.js').then(haploid => (window.haploid = haploid));
