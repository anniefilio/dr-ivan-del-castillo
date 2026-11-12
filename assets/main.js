// Internal navigation uses ordinary browser navigation in this tab, including
// links added later. Only HTTP(S) references to third parties open a new tab.
const siteScript = document.querySelector('script[src*="assets/main.js"]');
const siteRoot = new URL('../', siteScript?.src || window.location.href);
const normalizeSiteLink = link => {
 const raw = link.getAttribute('href');
 if (!raw) return;
 let destination;
 try { destination = new URL(raw, window.location.href); } catch { return; }
 const oldSite = destination.hostname === 'dr-ivan-del-castillo-columna.guillermo937720.chatgpt.site';
 const publicSite = destination.hostname === 'anniefilio.github.io' && destination.pathname.startsWith('/dr-ivan-del-castillo/');
 const sameSite = destination.origin === window.location.origin &&
  (destination.hostname !== 'anniefilio.github.io' || destination.pathname.startsWith(siteRoot.pathname));
 if (oldSite || publicSite) {
  const route = destination.pathname.replace(/^\/dr-ivan-del-castillo\//, '/');
  link.href = new URL(route.replace(/^\//, '') + destination.search + destination.hash, siteRoot).href;
 }
 if (sameSite || oldSite || publicSite || !/^https?:$/.test(destination.protocol)) {
  link.removeAttribute('target');
  link.relList.remove('noopener', 'noreferrer', 'external');
 } else {
  link.target = '_blank';
  link.relList.add('noopener', 'noreferrer');
 }
};
document.querySelectorAll('a[href]').forEach(normalizeSiteLink);
document.addEventListener('click', event => {
 const link = event.target.closest?.('a[href]');
 if (link) normalizeSiteLink(link);
}, true);
new MutationObserver(records => {
 for (const record of records) for (const node of record.addedNodes) {
  if (node.nodeType !== Node.ELEMENT_NODE) continue;
  if (node.matches('a[href]')) normalizeSiteLink(node);
  node.querySelectorAll('a[href]').forEach(normalizeSiteLink);
 }
}).observe(document.body, { childList: true, subtree: true });

// Clean addresses: sections are reached by scrolling, never by writing "#" into the URL.
// Cross-page links carry the section in data-section; same-page links keep href="#id" as
// a no-JavaScript fallback but are handled here without changing the address.
const sectionKey = 'ir-a-seccion';
const revealSection = (id, behavior) => {
 const target = id && document.getElementById(id);
 if (!target) return false;
 target.closest('details:not([open])')?.setAttribute('open', '');
 target.scrollIntoView(behavior ? { block: 'start', behavior } : { block: 'start' });
 if (!target.matches('a[href], button, input, select, textarea, summary, [tabindex]')) target.setAttribute('tabindex', '-1');
 target.focus({ preventScroll: true });
 return true;
};
document.addEventListener('click', event => {
 if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
 const link = event.target.closest?.('a[href]');
 if (!link || link.target === '_blank') return;
 const raw = link.getAttribute('href');
 if (raw.startsWith('#')) {
  if (raw.length > 1 && revealSection(decodeURIComponent(raw.slice(1)))) event.preventDefault();
  return;
 }
 const section = link.dataset.section;
 if (!section) return;
 if (link.pathname === window.location.pathname && revealSection(section)) {
  event.preventDefault();
  return;
 }
 try { sessionStorage.setItem(sectionKey, section); } catch {}
});
{
 let pending = null;
 if (window.location.hash.length > 1) {
  try { pending = decodeURIComponent(window.location.hash.slice(1)); } catch {}
  history.replaceState(history.state, '', window.location.pathname + window.location.search);
 } else {
  try { pending = sessionStorage.getItem(sectionKey); } catch {}
 }
 try { sessionStorage.removeItem(sectionKey); } catch {}
 if (pending) window.addEventListener('load', () => revealSection(pending, 'instant'), { once: true });
}

const footerMobile = window.matchMedia('(max-width: 800px)');
// Footer columns are always open on wide screens and collapse into accordions on phones.
const syncFooter = () => document.querySelectorAll('.foot-col').forEach(group => {
 group.open = !footerMobile.matches;
 group.querySelector('summary').tabIndex = footerMobile.matches ? 0 : -1;
});
syncFooter();
footerMobile.addEventListener('change', syncFooter);

const toggle=document.querySelector('.menu');
const navigation=document.querySelector('#navigation');
const careMenus=[...(navigation?.querySelectorAll('.care-menu')||[])];
const careMenuGroups=navigation?.querySelectorAll('.care-menu-group');
const narrowMenu=window.matchMedia('(max-width: 1100px)');
const closeCareMenus=(except=null)=>careMenus.forEach(menu=>{if(menu!==except)menu.open=false;});
const closeMenu=(restoreFocus=false)=>{
 toggle?.setAttribute('aria-expanded','false');
 toggle?.setAttribute('aria-label','Abrir menú de navegación');
 if(toggle)toggle.textContent='Menú';
 navigation?.classList.remove('open');
 closeCareMenus();
 if(restoreFocus)toggle?.focus();
};
// Opening one dropdown (Columna or Atención) closes the other.
careMenus.forEach(menu=>menu.addEventListener('toggle',()=>{if(menu.open)closeCareMenus(menu);}));
toggle?.addEventListener('click',()=>{
 const expanded=toggle.getAttribute('aria-expanded')==='true';
 toggle.setAttribute('aria-expanded',String(!expanded));
 toggle.setAttribute('aria-label',expanded?'Abrir menú de navegación':'Cerrar menú de navegación');
 toggle.textContent=expanded?'Menú':'Cerrar';
 navigation?.classList.toggle('open',!expanded);
});
document.addEventListener('keydown',event=>{
if(event.key!=='Escape')return;
const openMenu=careMenus.find(menu=>menu.open);
if(openMenu){
 openMenu.open=false;
 openMenu.querySelector('summary')?.focus();
}else if(navigation?.classList.contains('open'))closeMenu(true);
});
document.addEventListener('click',event=>{
 careMenus.forEach(menu=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
 if(navigation?.classList.contains('open')&&!navigation.contains(event.target)&&!toggle?.contains(event.target))closeMenu();
});
navigation?.addEventListener('click',event=>{if(event.target.closest('a')&&narrowMenu.matches)closeMenu();});
navigation?.addEventListener('focusout',event=>{
 careMenus.forEach(menu=>{if(menu.open&&event.relatedTarget&&!menu.contains(event.relatedTarget))menu.open=false;});
 if(narrowMenu.matches&&event.relatedTarget&&!navigation.contains(event.relatedTarget)&&!toggle?.contains(event.relatedTarget))closeMenu();
});
const syncCareMenu=()=>careMenuGroups?.forEach(group=>{group.open=!narrowMenu.matches;});
syncCareMenu();
narrowMenu.addEventListener('change',()=>{
 closeMenu();
 syncCareMenu();
});

const slider=document.querySelector('.hero-slider');
if(slider){
 const slides=[
  {name:'Valoración',eyebrow:'ORTOPEDIA Y CIRUGÍA DE COLUMNA · CDMX',title:'Volver a moverte. <br><em>Empezar por <br>entender.</em>',description:'Una valoración para conocer el origen de tus molestias, resolver tus dudas y explorar las opciones de atención.',captionLabel:'ESCUCHAR. VALORAR. EXPLICAR.',caption:'Tu siguiente paso, <br>con mayor claridad.'},
  {name:'Columna',eyebrow:'SALUD DE LA COLUMNA',title:'Entender el dolor. <br><em>Explorar tus <br>opciones.</em>',description:'Dolor cervical, lumbar o molestias que recorren una extremidad: conoce los padecimientos y prepara tus preguntas.',captionLabel:'COLUMNA VERTEBRAL',caption:'Información para <br>tu próxima consulta.'},
  {name:'Segunda opinión',eyebrow:'UNA DECISIÓN INFORMADA',title:'Más claridad. <br><em>Antes de <br>decidir.</em>',description:'Una segunda valoración permite revisar tu diagnóstico, los tratamientos previos y las alternativas para tu caso.',captionLabel:'SEGUNDA OPINIÓN',caption:'Tus dudas merecen <br>una conversación.'}
 ];
 const content=slider.querySelector('#hero-content');
 const images=[...slider.querySelectorAll('[data-slide-image]')];
 const get=id=>slider.querySelector('#hero-'+id);
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const FADE=1000,HOLD=7000,TEXT_OUT=180;
 let current=0,copyIndex=0,playing=!reducedMotion.matches,hoverPaused=false,focusPaused=false,ready=false;
 let timer,textTimer,finishTimer,transitioning=false,queued=null,lastWidth=0,measureQueued=false;
 const paintCopy=index=>{
  if(copyIndex===index)return;copyIndex=index;
  const slide=slides[index];
  get('eyebrow').textContent=slide.eyebrow;get('title').innerHTML=slide.title;
  get('description').textContent=slide.description;get('caption-label').textContent=slide.captionLabel;
  get('caption').innerHTML=slide.caption;
  content.setAttribute('aria-label',`${index+1} de ${slides.length}: ${slide.name}`);
  get('status').textContent=`Diapositiva ${index+1} de ${slides.length}: ${slide.name}`;
 };
 // Measure maximum text slots at the actual width, out of layout and inaccessible to AT.
 const measure=()=>{
  measureQueued=false;
  const width=content.getBoundingClientRect().width;if(!width)return;
  lastWidth=width;
  const probe=content.cloneNode(true);probe.id='hero-measure';probe.setAttribute('aria-hidden','true');probe.inert=true;
  probe.style.cssText=`position:absolute;visibility:hidden;pointer-events:none;width:${width}px;left:0;top:0;height:auto;min-height:0;opacity:1;z-index:-1`;
  content.parentElement.append(probe);
  const nodes={eyebrow:probe.querySelector('#hero-eyebrow'),title:probe.querySelector('#hero-title'),description:probe.querySelector('#hero-description')};
  const maximum={eyebrow:0,title:0,description:0};
  for(const node of Object.values(nodes)){node.style.minHeight='0';node.style.height='auto';}
  for(const slide of slides){
   nodes.eyebrow.textContent=slide.eyebrow;nodes.title.innerHTML=slide.title;nodes.description.textContent=slide.description;
   for(const key of Object.keys(nodes))maximum[key]=Math.max(maximum[key],nodes[key].getBoundingClientRect().height);
  }
  for(const key of Object.keys(nodes)){const size=Math.ceil(maximum[key])+'px';nodes[key].style.minHeight=size;get(key).style.minHeight=size;}
  content.style.minHeight=Math.ceil(probe.getBoundingClientRect().height)+'px';probe.remove();
  const caption=slider.querySelector('.photo-caption'),captionProbe=caption.cloneNode(true);
  captionProbe.setAttribute('aria-hidden','true');captionProbe.inert=true;
  captionProbe.style.cssText=`position:absolute;visibility:hidden;pointer-events:none;width:${caption.getBoundingClientRect().width}px;max-width:none;left:0;top:0;height:auto;z-index:-1`;
  caption.parentElement.append(captionProbe);
  const label=captionProbe.querySelector('#hero-caption-label'),text=captionProbe.querySelector('#hero-caption');
  label.style.minHeight='0';text.style.minHeight='0';let labelHeight=0,textHeight=0;
  for(const slide of slides){label.textContent=slide.captionLabel;text.innerHTML=slide.caption;labelHeight=Math.max(labelHeight,label.getBoundingClientRect().height);textHeight=Math.max(textHeight,text.getBoundingClientRect().height);}
  get('caption-label').style.minHeight=Math.ceil(labelHeight)+'px';get('caption').style.minHeight=Math.ceil(textHeight)+'px';captionProbe.remove();
 };
 const queueMeasure=()=>{if(!measureQueued){measureQueued=true;window.requestAnimationFrame(measure);}};
 const schedule=()=>{
  window.clearTimeout(timer);
  get('status').setAttribute('aria-live',playing?'off':'polite');
  if(playing&&ready&&!hoverPaused&&!focusPaused&&!document.hidden&&!transitioning)timer=window.setTimeout(()=>select(current+1,false),HOLD);
 };
 const setPlaying=value=>{playing=value;schedule();};
 const finish=()=>{
  window.clearTimeout(textTimer);window.clearTimeout(finishTimer);
  paintCopy(current);slider.classList.remove('is-changing');
  images.forEach((image,i)=>{image.classList.remove('is-leaving');image.classList.toggle('is-active',i===current);});
  transitioning=false;
  if(queued!==null){const next=queued;queued=null;select(next,true);}else schedule();
 };
 const select=(index,manual=true)=>{
  if(manual)setPlaying(false);
  const target=(index+slides.length)%slides.length;
  if(transitioning){queued=target;return;}
  if(target===current){schedule();return;}
  window.clearTimeout(timer);const previous=current;current=target;
  images.forEach((image,i)=>{image.classList.toggle('is-active',i===current);image.classList.toggle('is-leaving',i===previous);image.setAttribute('aria-hidden',String(i!==current));});
  slider.querySelector('.slider-photos').dataset.activeSlide=String(current);
  if(reducedMotion.matches){paintCopy(current);finish();return;}
  transitioning=true;slider.classList.add('is-changing');
  textTimer=window.setTimeout(()=>{paintCopy(current);slider.classList.remove('is-changing');},TEXT_OUT);
  finishTimer=window.setTimeout(finish,FADE);
 };
 images.forEach((image,i)=>{image.hidden=false;image.classList.toggle('is-active',i===0);image.setAttribute('aria-hidden',String(i!==0));});
 slider.classList.add('slider-ready');measure();
 Promise.all(images.map(image=>image.decode?image.decode().catch(()=>{}):Promise.resolve())).then(()=>{ready=true;schedule();});
 if(document.fonts)document.fonts.ready.then(queueMeasure);
 window.addEventListener('resize',queueMeasure);
 if('ResizeObserver' in window){const observer=new ResizeObserver(()=>{if(Math.abs(content.getBoundingClientRect().width-lastWidth)>.5)queueMeasure();});observer.observe(content);}
 slider.addEventListener('keydown',event=>{
  if(event.target.closest('a,button,.hero-credentials'))return;let next;
  if(event.key==='ArrowRight'||event.key==='ArrowDown')next=current+1;
  if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=current-1;
  if(event.key==='Home')next=0;if(event.key==='End')next=slides.length-1;
  if(next!==undefined){event.preventDefault();select(next);}
 });
 let gesture;
 slider.addEventListener('pointerdown',event=>{if(event.target.closest('.hero-credentials'))return;setPlaying(false);if(!event.isPrimary||event.button!==0||event.target.closest('a,button'))return;gesture={id:event.pointerId,x:event.clientX,y:event.clientY};slider.setPointerCapture(event.pointerId);});
 slider.addEventListener('pointerup',event=>{if(!gesture||gesture.id!==event.pointerId)return;const start=gesture;gesture=null;const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)select(current+(dx<0?1:-1));});
 slider.addEventListener('pointercancel',()=>{gesture=null;});
 slider.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hoverPaused=true;schedule();}});
 slider.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'){hoverPaused=false;schedule();}});
 slider.addEventListener('focusin',()=>{focusPaused=true;schedule();});
 slider.addEventListener('focusout',event=>{focusPaused=!!event.relatedTarget&&slider.contains(event.relatedTarget);schedule();});
 document.addEventListener('visibilitychange',schedule);
 reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){playing=false;if(transitioning)finish();}schedule();});
 window.addEventListener('pagehide',()=>{window.clearTimeout(timer);window.clearTimeout(textTimer);window.clearTimeout(finishTimer);});
 schedule();
}

const journalCards=[...document.querySelectorAll('.journal-card')];
if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
 const reveal=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-in-view');reveal.unobserve(entry.target);}}},{threshold:.12});
 journalCards.forEach(card=>reveal.observe(card));
}

document.querySelectorAll('.reviews-carousel').forEach(carousel => {
 const track = carousel.querySelector('.review-track');
 if (!track) return;
 const cards = [...track.children];
 if (cards.length < 2) return;

 const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
 const interval = Number(carousel.dataset.carouselInterval) || 4000;
 let playing = !reducedMotion.matches;

 const instructions = document.createElement('span');
 instructions.id = `${track.id}-instructions`;
 instructions.className = 'sr-only';
 instructions.textContent = 'Avance automático cada cuatro segundos. Se detiene al enfocar el carrusel. Usa las teclas de dirección para recorrerlo y la barra espaciadora para desactivar o reactivar el avance automático al salir.';
 track.setAttribute('aria-describedby', instructions.id);
 track.setAttribute('aria-keyshortcuts', 'Space ArrowLeft ArrowRight');
 carousel.append(instructions);

 const activeCard = () => {
  const start = track.getBoundingClientRect().left;
  return cards.reduce((closest, card, index) =>
   Math.abs(card.getBoundingClientRect().left - start) <
   Math.abs(cards[closest].getBoundingClientRect().left - start) ? index : closest, 0);
 };
 const advance = step => {
  const index = activeCard() + step;
  const wrapping = index < 0 || index >= cards.length;
  const card = cards[(index + cards.length) % cards.length];
  const offset = card.getBoundingClientRect().left - track.getBoundingClientRect().left;
  track.scrollBy({
   left: offset,
   behavior: wrapping || reducedMotion.matches ? 'instant' : 'smooth'
  });
 };

 reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) playing = false;
 });
 track.addEventListener('keydown', event => {
  if (event.target !== track || !['ArrowLeft', 'ArrowRight', ' '].includes(event.key)) return;
  event.preventDefault();
  if (event.key === ' ') playing = !playing;
  else advance(event.key === 'ArrowLeft' ? -1 : 1);
 });

 const timer = window.setInterval(() => {
  const bounds = carousel.getBoundingClientRect();
  if (playing && !document.hidden && !carousel.matches(':hover, :focus-within') &&
      bounds.bottom > 0 && bounds.top < window.innerHeight) {
   advance(1);
  }
 }, interval);
 window.addEventListener('pagehide', () => window.clearInterval(timer), { once: true });
});

const calendar = document.querySelector('[data-doctoralia-calendar]');
if (calendar) {
 const calendarPanel = calendar.closest('.calendar-disclosure');
 if (window.location.protocol === 'file:') {
  (calendarPanel || calendar).hidden = true;
 } else {
  let calendarRequested = false;
  const loadCalendar = () => {
   if (calendarRequested || (calendarPanel && !calendarPanel.open)) return;
   calendarRequested = true;
   const widget = document.createElement('script');
   widget.src = 'https://platform.docplanner.com/js/widget.js';
   widget.async = true;
   widget.addEventListener('error', () => { calendar.hidden = true; });
   window.requestAnimationFrame(() => document.head.append(widget));
  };
  calendarPanel?.addEventListener('toggle', loadCalendar);
  loadCalendar();
 }
}

const appointmentForm = document.querySelector('.appointment-form');
if (appointmentForm) {
 const nameInput = appointmentForm.querySelector('#cita-nombre');
 const phoneInput = appointmentForm.querySelector('#cita-telefono');
 const validateContact = () => {
  const digits = phoneInput.value.replace(/\D/g, '');
  nameInput.setCustomValidity(nameInput.value.trim() ? '' : 'Escribe tu nombre.');
  phoneInput.setCustomValidity(
   digits.length >= 10 && digits.length <= 15 ? '' :
   'Escribe un teléfono de 10 a 15 dígitos, con lada si corresponde.'
  );
 };
 nameInput.addEventListener('input', validateContact);
 phoneInput.addEventListener('input', validateContact);
 appointmentForm.querySelector('button[type="submit"]').disabled = false;
 appointmentForm.addEventListener('submit', event => {
  event.preventDefault();
  validateContact();
  if (!appointmentForm.reportValidity()) return;

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const schedule = appointmentForm.querySelector('#cita-horario').value;
  // On Contacto the form sits under the calendar and sends the day chosen there.
  const dayText = appointmentForm.matches('[data-booking-date-source]')
   ? (document.querySelector('[data-booking-date]')?.textContent || '').trim()
   : '';
  const day = dayText ? dayText.charAt(0).toLowerCase() + dayText.slice(1) : '';
  const message = [
   `Hola, soy ${name}.`,
   'Quisiera solicitar una primera consulta con el Dr. Iván del Castillo.',
   `Mi teléfono de contacto es ${phone}.`,
   day ? `Me gustaría el ${day}${schedule ? `, ${schedule}` : ''}.` : (schedule ? `De preferencia ${schedule}.` : ''),
   '¿Qué horarios tienen disponibles?'
  ].filter(Boolean).join(' ');
  const whatsapp = new URL(appointmentForm.dataset.whatsapp);
  whatsapp.searchParams.set('text', message);
  // Only this form sends the prepared message. WhatsApp opens as a third party in its own
  // tab while this tab moves to the internal thank-you page.
  try { sessionStorage.setItem('cita-whatsapp', whatsapp.href); } catch {}
  window.open(whatsapp.href, '_blank', 'noopener,noreferrer');
  window.location.assign(new URL('primera-consulta/gracias/', siteRoot).href);
 });
}

const thanksRetry = document.querySelector('[data-thanks-retry]');
if (thanksRetry) {
 let prepared = null;
 try { prepared = sessionStorage.getItem('cita-whatsapp'); } catch {}
 if (prepared && new URL(prepared).hostname === 'wa.me') {
  thanksRetry.href = prepared;
  thanksRetry.hidden = false;
 }
}

// Floating WhatsApp button: opens the chat with a short message about the page being read.
// The first-consultation form keeps its own detailed message.
const whatsappFab = document.querySelector('.whatsapp-fab');
if (whatsappFab) {
 const page = (document.querySelector('main h1')?.textContent || '').replace(/\s+/g, ' ').trim().replace(/[.]+$/, '');
 const home = window.location.pathname === siteRoot.pathname;
 const message = home || !page
  ? 'Hola, me gustaría información para agendar una consulta con el Dr. Iván del Castillo.'
  : `Hola, estoy leyendo «${page}» en el sitio del Dr. Iván del Castillo y me gustaría información para agendar una consulta.`;
 const chat = new URL(whatsappFab.href);
 chat.searchParams.set('text', message);
 whatsappFab.href = chat.href;
}

// Blocks marked always-open stay expanded even if a keyboard toggle reaches their summary.
document.querySelectorAll('details.always-open').forEach(block => {
 block.querySelector(':scope > summary')?.setAttribute('tabindex', '-1');
 block.addEventListener('toggle', () => { if (!block.open) block.open = true; });
});

// Credentials mosaic: every tile shows its own slice of one shared photo, and a tap reveals
// the credential on touch screens (hover and keyboard focus reveal it with CSS).
document.querySelectorAll('[data-cred-mosaic]').forEach(mosaic => {
 const tiles = [...mosaic.querySelectorAll('.cred-tile')];
 const ratio = 1500 / 2000;
 const focusY = .5; // vertical point of the photo kept at the centre of the mosaic (the doctor's face)
 const layout = () => {
  const box = mosaic.getBoundingClientRect();
  if (!box.width || !box.height) return;
  let width = box.width, height = box.width / ratio;
  if (height < box.height) { height = box.height; width = height * ratio; }
  const offsetX = (box.width - width) / 2;
  const offsetY = Math.min(0, Math.max(box.height - height, box.height / 2 - height * focusY));
  tiles.forEach(tile => {
   const r = tile.getBoundingClientRect();
   tile.style.backgroundSize = `${width}px ${height}px`;
   tile.style.backgroundPosition = `${offsetX - (r.left - box.left)}px ${offsetY - (r.top - box.top)}px`;
  });
 };
 layout();
 new ResizeObserver(layout).observe(mosaic);
 mosaic.addEventListener('click', event => {
  if (event.target.closest('a')) return;
  const tile = event.target.closest('.cred-tile');
  if (!tile) return;
  const open = !tile.classList.contains('is-revealed');
  tiles.forEach(t => t.classList.remove('is-revealed'));
  if (open) tile.classList.add('is-revealed');
 });
 mosaic.addEventListener('keydown', event => {
  const tile = event.target.closest('.cred-tile');
  if (!tile || (event.key !== 'Enter' && event.key !== ' ')) return;
  if (event.target.closest('a')) return;
  event.preventDefault();
  tile.classList.toggle('is-revealed');
 });
});

// Contacto: the request form at the top shows the day picked in the calendar below it.
const bookingDate = document.querySelector('[data-booking-date]');
const bookingMirror = document.querySelector('[data-booking-date-mirror]');
if (bookingDate && bookingMirror) {
 const mirror = () => { const text = bookingDate.textContent.trim(); if (text) bookingMirror.textContent = text; };
 mirror();
 new MutationObserver(mirror).observe(bookingDate, { childList: true, characterData: true, subtree: true });
}

// Second opinion spine: hovering, focusing or tapping a vertebra shows its question in the bubble,
// which moves to the height of that vertebra.
document.querySelectorAll('[data-spine-qa]').forEach(box => {
 let questions = [];
 try { questions = JSON.parse(box.querySelector('[data-spine-questions]').textContent); } catch {}
 const verts = [...box.querySelectorAll('.vertebra')];
 const row = box.querySelector('[data-spine-bubble]');
 const text = box.querySelector('[data-spine-text]');
 const count = box.querySelector('[data-spine-count]');
 const talk = box.querySelector('.spine-talk');
 if (!questions.length || !row || !text) return;
 let current = -1;
 const place = vert => {
  const t = talk.getBoundingClientRect(), v = vert.getBoundingClientRect();
  const y = v.top + v.height / 2 - t.top - row.offsetHeight / 2;
  const hint = box.querySelector('.spine-hint');
  const max = Math.max(0, talk.clientHeight - row.offsetHeight - (hint ? hint.offsetHeight + 10 : 26));
  row.style.setProperty('--qa-y', `${Math.round(Math.min(Math.max(y, 0), max))}px`);
 };
 const show = index => {
  const vert = verts[index];
  if (!vert) return;
  verts.forEach((v, i) => v.setAttribute('aria-pressed', String(i === index)));
  if (index !== current) {
   current = index;
   text.textContent = questions[index];
   if (count) count.textContent = `Pregunta ${index + 1} de ${questions.length}`;
   const bubble = row.querySelector('.so-bubble');
   bubble.style.animation = 'none'; void bubble.offsetWidth; bubble.style.animation = '';
  }
  place(vert);
 };
 verts.forEach((vert, i) => {
  vert.addEventListener('mouseenter', () => show(i));
  vert.addEventListener('focus', () => show(i));
  vert.addEventListener('click', () => show(i));
 });
 show(0);
 new ResizeObserver(() => current >= 0 && place(verts[current])).observe(box);
});

// Header dropdowns: the label is a link to its own page; the submenu opens on hover on wide
// screens, and with the arrow beside the label on touch screens and phones.
{
 const wideNav = window.matchMedia('(min-width: 1101px)');
 document.querySelectorAll('#navigation .care-menu').forEach(menu => {
  let closeTimer;
  menu.addEventListener('mouseenter', () => {
   if (!wideNav.matches) return;
   window.clearTimeout(closeTimer);
   document.querySelectorAll('#navigation .care-menu').forEach(other => { if (other !== menu) other.open = false; });
   menu.open = true;
  });
  menu.addEventListener('mouseleave', () => {
   if (!wideNav.matches) return;
   closeTimer = window.setTimeout(() => { menu.open = false; }, 200);
  });
 });
}
