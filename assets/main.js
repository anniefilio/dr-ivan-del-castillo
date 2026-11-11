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

const footerMobile = window.matchMedia('(max-width: 800px)');
const syncFooter = () => document.querySelectorAll('.footer-group').forEach(group => {
 group.open = !footerMobile.matches;
});
syncFooter();
footerMobile.addEventListener('change', syncFooter);

const toggle=document.querySelector('.menu');
const navigation=document.querySelector('#navigation');
const careMenu=navigation?.querySelector('.care-menu');
const careMenuGroups=careMenu?.querySelectorAll('.care-menu-group');
const narrowMenu=window.matchMedia('(max-width: 1100px)');
const closeMenu=(restoreFocus=false)=>{
 toggle?.setAttribute('aria-expanded','false');
 toggle?.setAttribute('aria-label','Abrir menú de navegación');
 if(toggle)toggle.textContent='Menú';
 navigation?.classList.remove('open');
 if(careMenu)careMenu.open=false;
 if(restoreFocus)toggle?.focus();
};
toggle?.addEventListener('click',()=>{
 const expanded=toggle.getAttribute('aria-expanded')==='true';
 toggle.setAttribute('aria-expanded',String(!expanded));
 toggle.setAttribute('aria-label',expanded?'Abrir menú de navegación':'Cerrar menú de navegación');
 toggle.textContent=expanded?'Menú':'Cerrar';
 navigation?.classList.toggle('open',!expanded);
});
document.addEventListener('keydown',event=>{
if(event.key!=='Escape')return;
if(careMenu?.open){
 careMenu.open=false;
 careMenu.querySelector('summary')?.focus();
}else if(navigation?.classList.contains('open'))closeMenu(true);
});
document.addEventListener('click',event=>{
 if(careMenu?.open&&!careMenu.contains(event.target))careMenu.open=false;
 if(navigation?.classList.contains('open')&&!navigation.contains(event.target)&&!toggle?.contains(event.target))closeMenu();
});
navigation?.addEventListener('click',event=>{if(event.target.closest('a')&&narrowMenu.matches)closeMenu();});
navigation?.addEventListener('focusout',event=>{
 if(careMenu?.open&&event.relatedTarget&&!careMenu.contains(event.relatedTarget))careMenu.open=false;
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

document.querySelectorAll('.reviews-carousel, .credentials-carousel').forEach(carousel => {
 const track = carousel.querySelector('.review-track, .credentials-track');
 if (!track) return;
 const cards = [...track.children];
 if (cards.length < 2) return;

 const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
 const interval = Number(carousel.dataset.carouselInterval) || 4000;
 let playing = !reducedMotion.matches;

 const pauseButton = document.createElement('button');
 pauseButton.type = 'button';
 pauseButton.className = 'carousel-playback sr-only';
 pauseButton.setAttribute('aria-controls', track.id);
 const updatePlayback = () => {
  pauseButton.textContent = playing ? 'Pausar avance automático' : 'Activar avance automático';
 };
 updatePlayback();
 carousel.append(pauseButton);

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

 pauseButton.addEventListener('click', () => {
  playing = !playing;
  updatePlayback();
 });
 reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) {
   playing = false;
   updatePlayback();
  }
 });
 track.addEventListener('keydown', event => {
  if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  advance(event.key === 'ArrowLeft' ? -1 : 1);
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

const visitOrientation = document.querySelector('.visit-orientation');
const fitVisitPanel = () => {
 if (!visitOrientation?.open) return;
 const panel = visitOrientation.querySelector('.visit-question');
 const top = panel.getBoundingClientRect().top;
 const viewport = window.visualViewport?.height || window.innerHeight;
 const available = viewport - Math.max(top, 0) - 20;
 // Never move the document to reveal an answer or float over adjacent content.
 panel.style.setProperty('--visit-panel-height', `${Math.max(180, Math.min(420, viewport * .58, available))}px`);
};
let visitFitFrame;
const queueVisitFit = () => {
 window.cancelAnimationFrame(visitFitFrame);
 visitFitFrame = window.requestAnimationFrame(fitVisitPanel);
};
visitOrientation?.addEventListener('toggle', queueVisitFit);
window.addEventListener('resize', queueVisitFit);
window.visualViewport?.addEventListener('resize', queueVisitFit);
visitOrientation?.querySelector('.visit-question')?.addEventListener('keydown', event => {
 if (event.target !== event.currentTarget) return;
 const panel = event.currentTarget;
 const steps = { PageDown: panel.clientHeight * .8, PageUp: -panel.clientHeight * .8, ArrowDown: 40, ArrowUp: -40 };
 if (event.key in steps) {
  event.preventDefault();
  panel.scrollBy({ top: steps[event.key], behavior: 'instant' });
 } else if (event.key === 'Home' || event.key === 'End') {
  event.preventDefault();
  panel.scrollTo({ top: event.key === 'Home' ? 0 : panel.scrollHeight, behavior: 'instant' });
 }
});
visitOrientation?.addEventListener('change', event => {
 if (!event.target.matches('input[name="orientacion-visita"]')) return;
 visitOrientation.querySelectorAll('[data-visit-result]').forEach(result => {
  result.hidden = result.dataset.visitResult !== event.target.value;
 });
 window.requestAnimationFrame(() => {
  const panel = visitOrientation.querySelector('.visit-question');
  const result = visitOrientation.querySelector('[data-visit-result]:not([hidden])');
  if (!panel || !result) return;
  const panelBounds = panel.getBoundingClientRect();
  const resultBounds = result.getBoundingClientRect();
  const overflow = resultBounds.bottom - panelBounds.bottom + 12;
  if (overflow > 0) {
   panel.scrollBy({
    top: overflow,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
   });
  }
 });
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
  const message = [
   `Hola, soy ${name}.`,
   'Quisiera solicitar una primera consulta con el Dr. Iván del Castillo.',
   `Mi teléfono de contacto es ${phone}.`,
   schedule ? `De preferencia ${schedule}.` : '',
   '¿Qué horarios tienen disponibles?'
  ].filter(Boolean).join(' ');
  const whatsapp = new URL(appointmentForm.dataset.whatsapp);
  whatsapp.searchParams.set('text', message);
  window.open(whatsapp.href, '_blank', 'noopener,noreferrer');
 });
}
