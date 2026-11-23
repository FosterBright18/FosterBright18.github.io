// Optional, run locally: node tools/generate-static.mjs
// Rewrites the crawlable static HTML block in index.html from src/content.js. Commit the result. Not a deploy build step.
import { readFileSync, writeFileSync } from 'node:fs';

const code = readFileSync(new URL('../src/content.js', import.meta.url), 'utf8').replace('export const C =', 'const C =');
const C = new Function(code + '\nreturn C;')();
const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const li = a => a.map(x => `<li>${e(x)}</li>`).join('');
const link = (h, t) => `<a href="${h}">${e(t)}</a>`;

const html = `<section id="static" class="sr"><h1>${e(C.name)}</h1><p>${e(C.title)}, ${e(C.loc)}</p><p>${e(C.summary)}</p>
<h2>Education</h2><p>${e(C.edu.degree)}, ${e(C.edu.school)}. ${e(C.edu.note)}</p>
<h2>Experience</h2><h3>${e(C.job.role)}, ${e(C.job.org)} (${e(C.job.dates)})</h3><p>${e(C.job.context)}</p><ul>${li(C.job.bullets)}</ul>
<h2>Projects</h2>${C.projects.map(p => `<h3>${e(p.name)}</h3><p>${e(p.short)}</p><ul>${li(p.bullets)}</ul><p>${e(p.stack.join(', '))}. ${link(p.repo, 'Repository')} ${link(p.demo, 'Live demo')}</p>`).join('')}
<h2>Skills</h2>${Object.entries(C.skills).map(([k, v]) => `<p>${e(k)}: ${e(v.join(', '))}</p>`).join('')}<h2>Coursework</h2><p>${e(C.courses.join(', '))}</p><p>${e(C.support)}</p>
<h2>How I work</h2><ul>${li(C.how)}</ul><p>${link(C.gh, 'GitHub')}</p></section>`;

const f = new URL('../index.html', import.meta.url);
let s = readFileSync(f, 'utf8');
s = s.replace(/<!--STATIC-START-->[\s\S]*?<!--STATIC-END-->/, `<!--STATIC-START-->${html}<!--STATIC-END-->`);
writeFileSync(f, s);
console.log('Static fallback block in index.html updated from src/content.js.');
