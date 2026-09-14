/**
 * cp-markdown.js
 * Gère le passage automatique entre mode "édition" (textarea/input) 
 * et mode "affichage" (Markdown rendu) pour tous les champs texte.
 */

(function() {
  function renderMarkdown(text, isInline) {
    if (typeof marked !== 'undefined') {
      return isInline ? marked.parseInline(text) : marked.parse(text);
    }
    return text.replace(/\n/g, '<br>');
  }

  function getWrapper(el) {
    if (el.parentElement.classList.contains('cp-md-wrapper')) {
      return el.parentElement;
    }
    
    // Créer le wrapper
    const wrapper = document.createElement('div');
    wrapper.classList.add('cp-md-wrapper');
    const style = window.getComputedStyle(el);
    
    // On rend le wrapper invisible pour le layout (flexbox/grid) 
    // pour que l'élément garde ses propriétés natives par rapport à son parent.
    wrapper.style.display = 'contents';

    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
    
    // Créer la zone d'affichage
    const view = document.createElement('div');
    view.classList.add('cp-md-view');
    view.style.display = 'none';
    wrapper.appendChild(view);
    
    // Au clic sur la vue, on repasse en édition
    view.addEventListener('click', () => {
      view.style.display = 'none';
      el.style.display = el._cp_orig_display || '';
      el.focus();
    });
    
    return wrapper;
  }

  function switchToView(el) {
    if (!el || el.offsetParent === null) return;
    
    const wrapper = getWrapper(el);
    const view = wrapper.querySelector('.cp-md-view');
    const isTextarea = el.tagName === 'TEXTAREA';
    
    // Synchroniser les dimensions et styles
    const style = window.getComputedStyle(el);
    if (!el._cp_orig_display || el._cp_orig_display === 'none') {
      el._cp_orig_display = style.display;
    }

    view.style.width = el.offsetWidth + 'px';
    view.style.height = el.offsetHeight + 'px';
    view.style.margin = style.margin;
    view.style.padding = style.padding;
    view.style.borderWidth = style.borderWidth;
    view.style.borderStyle = style.borderStyle;
    view.style.borderColor = style.borderColor;
    view.style.borderRadius = style.borderRadius;
    view.style.background = style.background;
    view.style.color = style.color;
    view.style.fontSize = style.fontSize;
    view.style.fontFamily = style.fontFamily;
    view.style.fontWeight = style.fontWeight;
    view.style.lineHeight = style.lineHeight;
    view.style.verticalAlign = style.verticalAlign;
    view.style.flex = style.flex;
    view.style.boxSizing = 'border-box';

    if (isTextarea) {
      view.style.overflowY = 'auto';
      view.style.resize = style.resize;
      view.style.display = 'block';
    } else {
      view.style.overflow = 'hidden';
      view.style.whiteSpace = 'nowrap';
      view.style.display = 'flex';
      view.style.alignItems = 'center';
      // Permettre aux éléments inline (strong, em, etc.) d'être rendus
      view.style.textOverflow = 'clip'; 
    }

    const val = el.value.trim();
    if (val) {
      // marked.parseInline permet le gras, l'italique, etc. sans créer de paragraphes <p>
      view.innerHTML = renderMarkdown(val, !isTextarea);
      view.classList.remove('cp-md-empty');
    } else {
      view.innerHTML = `<span class="cp-md-placeholder">${el.placeholder || '...'}</span>`;
      view.classList.add('cp-md-empty');
    }
    
    el.style.display = 'none';
    view.style.display = 'block';
  }

  function switchToEdit(el) {
    const wrapper = getWrapper(el);
    const view = wrapper.querySelector('.cp-md-view');
    
    if (el.tagName === 'TEXTAREA' && view.style.display !== 'none') {
      el.style.width = view.offsetWidth + 'px';
      el.style.height = view.offsetHeight + 'px';
    }

    view.style.display = 'none';
    el.style.display = '';
  }

  // Délégation d'événements pour gérer les éléments dynamiques
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text')) {
      switchToEdit(el);
    }
  });

  document.addEventListener('focusout', (e) => {
    const el = e.target;
    if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text')) {
      switchToView(el);
    }
  });

  // Initialisation pour les éléments déjà présents
  function initAll() {
    const inputs = document.querySelectorAll('textarea, input[type="text"]');
    inputs.forEach(el => {
      // On évite de boucler si déjà wrappé
      if (!el.parentElement.classList.contains('cp-md-wrapper')) {
        if (document.activeElement !== el) {
          switchToView(el);
        }
      }
    });
  }

  // Plusieurs tentatives d'initialisation pour parer au chargement asynchrone des composants Quartz
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
  window.addEventListener('load', initAll);
  // Un petit délai supplémentaire pour les scripts JS qui injectent du contenu après 'load'
  setTimeout(initAll, 500);
  setTimeout(initAll, 2000);

  observer.observe(document.body, { childList: true, subtree: true });

})();
