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
  courses: () => `<h2>Selected ASU coursework</h2><p class="lead">${C.edu.school}</p><ul>${li(C.courses)}</ul><h3>Coursework that supports this work</h3><p>${C.support}</p>`,
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
    <section><h2>Skills</h2>${skills()}<h3>ASU Coursework</h3><ul>${li(C.courses)}</ul><p>${C.support}</p></section>
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
      menu: $('#menu'), page: $('#page'), play: $('#play'), media: $('#media'),
      resume: $('#resume'), prompt: $('#prompt'), toastEl: $('#toast'), online: $('#online')
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
  get open() { return !this.e.start.hidden || !this.e.panel.hidden || !this.e.menu.hidden || !this.e.page.hidden || !this.e.play.hidden || !this.e.media.hidden || this.e.resume.classList.contains('show'); }
  progress(f, m) { this.e.bar.style.width = Math.round(f * 100) + '%'; if (m) this.e.lt.textContent = m; }
  ready() { this.e.load.hidden = true; this.e.start.hidden = false; $('#enter').focus(); }
  lockOff() { document.exitPointerLock && document.exitPointerLock(); }
  setOnline(n) { if (!this.e.online) return; this.e.online.hidden = n < 1; this.e.online.textContent = n === 1 ? '1 visitor online' : `${n} visitors online`; }
  panel(html) { this.closeAll(); this.e.pbody.innerHTML = html; this.e.panel.hidden = false; this.e.panel.scrollTop = 0; this.lockOff(); $('#panel [data-close]').focus(); }
  menu(on = true) { this.closeAll(); this.e.menu.hidden = !on; if (on) { this.lockOff(); $('#resumebtn').focus(); } }
  page(on = true) { this.closeAll(); this.e.page.hidden = !on; this.e.page.scrollTop = 0; if (on) { this.lockOff(); const btn = $('#page [data-close]'); if (btn) btn.focus(); } }
  resumeView() { this.closeAll(); this.e.resume.classList.add('show'); this.e.resume.scrollTop = 0; this.lockOff(); }

  // Full-screen UNOMi media lightbox (plays real .mp4/.webm videos or shows high-res .png/.jpg images from assets/unomi/)
  media(item) {
    this.closeAll();
    this.e.media.hidden = false;
    this.lockOff();
    $('#mtitle').textContent = item.title;
    $('#msub').textContent = item.subtitle;
    $('#mcap').textContent = item.caption;
    const stage = $('#mstage');
    stage.replaceChildren();
    const fallback = () => {
      const box = document.createElement('div');
      box.className = 'mempty';
      box.innerHTML = `<h3>Media slot ready</h3><p class="lead">Drop your ${item.type === 'video' ? 'video (.mp4 or .webm)' : 'image (.png or .jpg)'} file into your repo at:</p><p class="mono">${item.src}</p><p>Once pushed to GitHub Pages, this 3D wall display and full-screen viewer will automatically play/render your real UNOMi work.</p>`;
      stage.replaceChildren(box);
    };
    if (item.type === 'video') {
      const v = document.createElement('video');
      v.src = item.src; v.controls = true; v.autoplay = true; v.loop = true; v.playsInline = true;
      v.onerror = fallback;
      stage.append(v);
    } else {
      const img = document.createElement('img');
      img.src = item.src; img.alt = item.title;
      img.onerror = fallback;
      stage.append(img);
    }
    $('#mexit').focus();
  }

  killMedia() {
    const v = $('#mstage video');
    if (v) { try { v.pause(); v.src = ''; } catch {} }
    $('#mstage').replaceChildren();
    this.e.media.hidden = true;
  }

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
  closeAll(notify) { for (const k of ['start', 'panel', 'menu', 'page']) this.e[k].hidden = true; this.killPlay(); this.killMedia(); this.e.resume.classList.remove('show'); if (notify) this.onClose(); }
  prompt(t) { this.e.prompt.hidden = !t; if (t) this.e.prompt.innerHTML = '<b>E</b> ' + t; }
  toast(m) { const t = this.e.toastEl; t.textContent = m; t.classList.add('show'); clearTimeout(this.tt); this.tt = setTimeout(() => t.classList.remove('show'), 2800); }
}
