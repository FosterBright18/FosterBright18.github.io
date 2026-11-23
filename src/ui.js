import { C } from './content.js';
const $ = s => document.querySelector(s), COLD = 'Hosted on Render Free Tier. Allow ~45s for server cold-start.';
const li = a => a.map(x => `<li>${x}</li>`).join('');
const a = (h, t) => `<a href="${h}" target="_blank" rel="noopener">${t}</a>`;
const dl = r => `<dl>${r.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
const skills = () => Object.entries(C.skills).map(([k, v]) => `<h3>${k}</h3><p>${v.join(', ')}</p>`).join('');
const verify = () => `<ul>${C.projects.map(p => `<li><b>${p.name}</b><br>${a(p.repo, 'Repository')} ${a(p.demo, 'Live demo')}</li>`).join('')}<li><b>UNOMi Software Update (Emotion Engine)</b><br>${C.unomiVerify}</li></ul>`;
const download = () => { const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([H.text()], { type: 'text/plain' })); l.download = 'foster-bright-resume.txt'; l.click(); };

export const H = {
  project: p => `<h2>${p.name}</h2><p class="lead">${p.short}</p><p class="mono">${p.stack.join(' / ')}</p>
    <p class="links"><button class="go" data-play="${p.id}">Launch live demo</button>${a(p.repo, 'Repository')}${a(p.demo, 'Open in new tab')}</p>
    <h3>What it does</h3><ul>${li(p.bullets)}</ul>
    <h3>How it is built</h3><p class="mono">${p.flow.join(' &rarr; ')}</p><p>${p.data}</p>${dl(p.challenges)}
    <h3>Tradeoffs and constraints</h3><ul>${li(p.trade)}</ul>${p.cold ? `<p class="note">${COLD}</p>` : ''}
    <h3>What I would improve next</h3><p>${p.next || '[FOSTER TO CONFIRM]'}</p>`,
  job: () => `<h2>${C.job.role}</h2><p class="lead">${C.job.org}</p><p class="mono">${C.job.dates}</p>
    <h3>UNOMi Emotion Engine context</h3><p>${C.job.context}</p>
    <h3>Verified contributions</h3><ul>${li(C.job.bullets)}</ul>
    <p class="mono">${C.unomiVerify}</p>`,
  facts: () => `<h2>Recruiter quick sheet</h2>${dl(C.facts)}<p class="links">${a(C.gh, 'GitHub')}<button data-print>Print resume</button><button data-txt>Download plain text</button></p>`,
  skills: () => `<h2>Skills</h2>${skills()}`,
  courses: () => `<h2>Selected coursework</h2><p class="lead">${C.edu.school}</p><ul>${li(C.courses)}</ul><h3>Coursework that supports this work</h3><p>${C.support}</p>`,
  verify: () => `<h2>Verify it yourself</h2>${verify()}`,
  how: () => `<h2>How I work</h2><ul>${li(C.how)}</ul>`,
  resume: () => `<article class="sheet"><h1>${C.name}</h1><p>${C.loc} | ${C.email} | ${C.gh.replace('https://', '')}</p>
    <h2>Education</h2><p><b>${C.edu.school}</b> | ${C.edu.degree}<br>${C.edu.note}</p>
    <h2>Experience</h2><p><b>${C.job.role}</b>, ${C.job.org} | ${C.job.dates}</p>
    <p>${C.job.context}</p><ul>${li(C.job.bullets)}</ul>
    <h2>Projects</h2>${C.projects.map(p => `<p><b>${p.name}</b> | ${p.stack.join(', ')}<br>${p.repo.replace('https://', '')} | ${p.demo.replace('https://', '')}</p><ul>${li(p.bullets.slice(0, 2))}</ul>`).join('')}
    <h2>Technical skills</h2>${Object.entries(C.skills).map(([k, v]) => `<p><b>${k}:</b> ${v.join(', ')}</p>`).join('')}<p><b>Coursework:</b> ${C.courses.join(', ')}</p></article>`,
  page: () => `<div class="col"><button data-close>Back to the walk</button><header><h1>${C.name}</h1><p class="lead">${C.title}, ${C.loc}</p><p>${C.summary}</p><p class="links">${a(C.gh, 'GitHub')}<button data-print>Print resume</button><button data-txt>Download plain text</button></p></header>
    <section><h2>Recruiter quick sheet</h2>${dl(C.facts)}</section>
    <section><h2>Experience</h2>${H.job()}</section>
    <section><h2>Education</h2><p>${C.edu.degree}, ${C.edu.school}. ${C.edu.note}</p></section>
    <section><h2>Timeline</h2>${dl(C.timeline)}</section>
    <section><h2>Projects</h2>${C.projects.map(p => H.project(p).replace('<h2>', '<h3 class="pn">').replace('</h2>', '</h3>')).join('')}</section>
    <section><h2>Skills</h2>${skills()}<h3>Coursework</h3><p>${C.courses.join(', ')}</p><p>${C.support}</p></section>
    <section><h2>How I work</h2><ul>${li(C.how)}</ul></section>
    <section><h2>Verify it yourself</h2>${verify()}</section>
    ${C.refs.length ? `<section><h2>References</h2>${dl(C.refs.map(r => [r.who, r.what]))}</section>` : ''}</div>`,
  text: () => [
    C.name,
    C.title + ' | ' + C.loc,
    C.email + ' | ' + C.gh,
    '',
    'EDUCATION',
    C.edu.school + ', ' + C.edu.degree + '. ' + C.edu.note,
    '',
    'EXPERIENCE',
    C.job.role + ', ' + C.job.org + ' (' + C.job.dates + ')',
    C.job.context,
    ...C.job.bullets.map(b => '- ' + b),
    '',
    'PROJECTS',
    ...C.projects.flatMap(p => [p.name + ' | ' + p.repo + ' | ' + p.demo, ...p.bullets.map(b => '- ' + b)]),
    '',
    'SKILLS',
    ...Object.entries(C.skills).map(([k, v]) => k + ': ' + v.join(', ')),
    'Coursework: ' + C.courses.join(', ')
  ].join('\n')
};

export class UI {
  constructor() {
    this.e = {
      load: $('#load'), bar: $('#bar i'), lt: $('#lt'),
      start: $('#start'), panel: $('#panel'), pbody: $('#pbody'),
      menu: $('#menu'), page: $('#page'), play: $('#play'),
      resume: $('#resume'), prompt: $('#prompt'), toastEl: $('#toast')
    };
    this.e.resume.innerHTML = '<div class="rbar"><button class="go" data-print>Print / Save as PDF</button><button data-close>Close</button></div>' + H.resume();
    this.e.page.innerHTML = H.page();
    this.onClose = () => {};
    document.addEventListener('click', ev => {
      if (ev.target.closest('[data-close]')) this.closeAll(true);
      if (ev.target.closest('[data-print]')) print();
      if (ev.target.closest('[data-txt]')) download();
      const pb = ev.target.closest('[data-play]');
      if (pb) { const proj = C.projects.find(x => x.id === pb.dataset.play); if (proj) this.play(proj); }
    });
    addEventListener('keydown', ev => { if (ev.key === 'Escape' && this.open && this.e.start.hidden) this.closeAll(true); });
  }
  get open() { return !this.e.start.hidden || !this.e.panel.hidden || !this.e.menu.hidden || !this.e.page.hidden || !this.e.play.hidden || this.e.resume.classList.contains('show'); }
  progress(f, m) { this.e.bar.style.width = Math.round(f * 100) + '%'; if (m) this.e.lt.textContent = m; }
  ready() { this.e.load.hidden = true; this.e.start.hidden = false; $('#enter').focus(); }
  lockOff() { document.exitPointerLock && document.exitPointerLock(); }
  panel(html) { this.closeAll(); this.e.pbody.innerHTML = html; this.e.panel.hidden = false; this.e.panel.scrollTop = 0; this.lockOff(); $('#panel [data-close]').focus(); }
  menu(on = true) { this.closeAll(); this.e.menu.hidden = !on; if (on) { this.lockOff(); $('#resumebtn').focus(); } }
  page(on = true) { this.closeAll(); this.e.page.hidden = !on; this.e.page.scrollTop = 0; if (on) { this.lockOff(); const btn = $('#page [data-close]'); if (btn) btn.focus(); } }
  resumeView() { this.closeAll(); this.e.resume.classList.add('show'); this.e.resume.scrollTop = 0; this.lockOff(); }
  // Play mode: live site in an iframe, created lazily on open and removed on exit so audio and network activity stop.
  play(p) {
    this.closeAll(); this.e.play.hidden = false; this.lockOff(); $('#ptitle').textContent = p.name; $('#pnew').href = p.demo;
    $('#pnote').textContent = p.cold
      ? COLD + ' Multiplayer: open it in two tabs or with a friend for Quick Match, or use the bot button to play solo.'
      : 'Loading the live site. If framing is blocked or slow, use Open in new tab.';
    const fr = document.createElement('iframe');
    fr.title = p.name;
    fr.allow = 'autoplay; fullscreen; clipboard-write';
    fr.src = p.demo;
    $('#pframe').replaceChildren(fr);
    const t0 = Date.now();
    clearInterval(this.pt);
    $('#pel').textContent = '0s';
    this.pt = setInterval(() => { $('#pel').textContent = Math.floor((Date.now() - t0) / 1000) + 's'; }, 1000);
    fr.onload = () => { clearInterval(this.pt); $('#pel').textContent = 'loaded'; };
    $('#pexit').focus();
  }
  killPlay() { clearInterval(this.pt); $('#pframe').replaceChildren(); this.e.play.hidden = true; }
  closeAll(notify) { for (const k of ['start', 'panel', 'menu', 'page']) this.e[k].hidden = true; this.killPlay(); this.e.resume.classList.remove('show'); if (notify) this.onClose(); }
  prompt(t) { this.e.prompt.hidden = !t; if (t) this.e.prompt.innerHTML = '<b>E</b> ' + t; }
  toast(m) { const t = this.e.toastEl; t.textContent = m; t.classList.add('show'); clearTimeout(this.tt); this.tt = setTimeout(() => t.classList.remove('show'), 2800); }
}
