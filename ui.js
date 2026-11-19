import { C } from './content.js';
const $ = s => document.querySelector(s), COLD = 'Hosted on Render Free Tier. Allow ~45s for server cold-start.';
const li = a => a.map(x => `<li>${x}</li>`).join(''), a = (h, t) => `<a href="${h}" target="_blank" rel="noopener">${t}</a>`;
const skills = () => Object.entries(C.skills).map(([k, v]) => `<h3>${k}</h3><p>${v.join(', ')}</p>`).join('');
export const H = {
  project: p => `<h2>${p.name}</h2><p class="lead">${p.short}</p><p class="mono">${p.stack.join(' / ')}</p><ul>${li(p.bullets)}</ul>
    <h3>Architecture</h3><p class="mono">${p.flow.join(' &rarr; ')}</p><h3>Challenges solved</h3><dl>${p.challenges.map(([h, t]) => `<dt>${h}</dt><dd>${t}</dd>`).join('')}</dl>
    <h3>Data flow</h3><p>${p.data}</p><p class="links">${a(p.repo, 'Repository')}${a(p.demo, 'Live demo')}</p>${p.cold ? `<p class="note">${COLD}</p>` : ''}`,
  job: () => `<h2>${C.job.role}</h2><p class="lead">${C.job.org}</p><p class="mono">${C.job.dates}</p><ul>${li(C.job.bullets)}</ul>`,
  facts: () => `<h2>Quick facts</h2><dl>${C.facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`,
  skills: () => `<h2>Skills</h2>${skills()}`,
  courses: () => `<h2>Selected coursework</h2><p class="lead">${C.edu.school}</p><ul>${li(C.courses)}</ul>`,
  resume: () => `<article class="sheet"><h1>${C.name}</h1><p>${C.loc} | ${C.email} | ${C.gh.replace('https://', '')}</p>
    <h2>Education</h2><p><b>${C.edu.school}</b> | ${C.edu.degree}<br>${C.edu.note}</p>
    <h2>Experience</h2><p><b>${C.job.role}</b>, ${C.job.org} | ${C.job.dates}</p><ul>${li(C.job.bullets)}</ul>
    <h2>Projects</h2>${C.projects.map(p => `<p><b>${p.name}</b> | ${p.stack.join(', ')}<br>${p.repo.replace('https://', '')} | ${p.demo.replace('https://', '')}</p><ul>${li(p.bullets.slice(0, 2))}</ul>`).join('')}
    <h2>Technical skills</h2>${Object.entries(C.skills).map(([k, v]) => `<p><b>${k}:</b> ${v.join(', ')}</p>`).join('')}<p><b>Coursework:</b> ${C.courses.join(', ')}</p></article>`,
  page: () => `<div class="col"><button data-close>Back to the walk</button><header><h1>${C.name}</h1><p class="lead">${C.title}, ${C.loc}</p><p>${C.summary}</p><p class="links">${a(C.gh, 'GitHub')}<button data-print>Print resume</button></p></header>
    <section><h2>Experience</h2>${H.job()}</section><section><h2>Education</h2><p>${C.edu.degree}, ${C.edu.school}. ${C.edu.note}</p></section>
    <section><h2>Projects</h2>${C.projects.map(p => H.project(p).replace('<h2>', '<h3 class="pn">').replace('</h2>', '</h3>')).join('')}</section><section><h2>Skills</h2>${skills()}<h3>Coursework</h3><p>${C.courses.join(', ')}</p></section>
    <section><h2>Facts</h2><dl>${C.facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></section></div>`,
  text: () => [C.name, C.title + ' | ' + C.loc, C.email + ' | ' + C.gh, '', 'EDUCATION', C.edu.school + ', ' + C.edu.degree + '. ' + C.edu.note, '', 'EXPERIENCE', C.job.role + ', ' + C.job.org + ' (' + C.job.dates + ')', ...C.job.bullets.map(b => '- ' + b), '',
    'PROJECTS', ...C.projects.flatMap(p => [p.name + ' | ' + p.repo + ' | ' + p.demo, ...p.bullets.map(b => '- ' + b)]), '', 'SKILLS', ...Object.entries(C.skills).map(([k, v]) => k + ': ' + v.join(', ')), 'Coursework: ' + C.courses.join(', ')].join('\n')
};
export class UI {
  constructor() {
    this.e = { load: $('#load'), bar: $('#bar i'), lt: $('#lt'), start: $('#start'), panel: $('#panel'), pbody: $('#pbody'), menu: $('#menu'), page: $('#page'), resume: $('#resume'), prompt: $('#prompt'), toastEl: $('#toast') };
    this.e.resume.innerHTML = '<div class="rbar"><button class="go" data-print>Print / Save as PDF</button><button data-close>Close</button></div>' + H.resume(); this.e.page.innerHTML = H.page(); this.onClose = () => {};
    document.addEventListener('click', ev => { if (ev.target.closest('[data-close]')) this.closeAll(true); if (ev.target.closest('[data-print]')) print(); });
    addEventListener('keydown', ev => { if (ev.key === 'Escape' && this.open && this.e.start.hidden) this.closeAll(true); });
  }
  get open() { return !this.e.start.hidden || !this.e.panel.hidden || !this.e.menu.hidden || !this.e.page.hidden || this.e.resume.classList.contains('show'); }
  progress(f, m) { this.e.bar.style.width = Math.round(f * 100) + '%'; if (m) this.e.lt.textContent = m; }
  ready() { this.e.load.hidden = true; this.e.start.hidden = false; $('#enter').focus(); }
  lockOff() { document.exitPointerLock && document.exitPointerLock(); }
  panel(html) { this.closeAll(); this.e.pbody.innerHTML = html; this.e.panel.hidden = false; this.e.panel.scrollTop = 0; this.lockOff(); $('#panel [data-close]').focus(); }
  menu(on = true) { this.closeAll(); this.e.menu.hidden = !on; if (on) { this.lockOff(); $('#resumebtn').focus(); } }
  page(on = true) { this.closeAll(); this.e.page.hidden = !on; this.e.page.scrollTop = 0; if (on) this.lockOff(); }
  resumeView() { this.closeAll(); this.e.resume.classList.add('show'); this.e.resume.scrollTop = 0; this.lockOff(); }
  closeAll(notify) { for (const k of ['start', 'panel', 'menu', 'page']) this.e[k].hidden = true; this.e.resume.classList.remove('show'); if (notify) this.onClose(); }
  prompt(t) { this.e.prompt.hidden = !t; if (t) this.e.prompt.innerHTML = '<b>E</b> ' + t; }
  toast(m) { const t = this.e.toastEl; t.textContent = m; t.classList.add('show'); clearTimeout(this.tt); this.tt = setTimeout(() => t.classList.remove('show'), 2600); }
}
