/**
 * cp-markdown.js
 * Gère le passage automatique entre mode "édition" (textarea/input) 
 * et mode "affichage" (Markdown rendu) pour tous les champs texte.
 */

(function() {
  console.log("CP-Markdown chargé v4");
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
    
    // On rend le wrapper invisible pour le layout (flexbox/grid) 
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
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    if (!el._cp_orig_display || el._cp_orig_display === 'none') {
      el._cp_orig_display = style.display;
    }

    // Copie chirurgicale des dimensions et du positionnement
    // On utilise la largeur de contenu exacte pour éviter tout débordement à droite
    view.style.width = rect.width + 'px';
    view.style.height = rect.height + 'px';
    view.style.minWidth = style.minWidth;
    view.style.maxWidth = style.maxWidth;
    view.style.minHeight = style.minHeight;
    view.style.maxHeight = style.maxHeight;
    
    // Copie des styles de boîte
    view.style.margin = style.margin;
    view.style.padding = style.padding;
    view.style.border = style.border;
    view.style.borderRadius = style.borderRadius;
    view.style.boxSizing = 'border-box';
    
    // Copie des styles de texte
    view.style.fontSize = style.fontSize;
    view.style.fontFamily = style.fontFamily;
    view.style.fontWeight = style.fontWeight;
    view.style.lineHeight = style.lineHeight;
    view.style.color = style.color;
    view.style.textAlign = style.textAlign;
    view.style.verticalAlign = style.verticalAlign;
    
    // Aligner en flex si le texte est centré ou à droite
    if (style.textAlign === 'center') {
      view.style.justifyContent = 'center';
      view.style.justifySelf = 'center';
    } else if (style.textAlign === 'right') {
      view.style.justifyContent = 'flex-end';
      view.style.justifySelf = 'flex-end';
    }
    
    // Copie des styles de flex/layout
    view.style.flex = style.flex;
    view.style.alignSelf = style.alignSelf;
    // Si textAlign a déjà forcé justifySelf, on ne l'écrase pas par 'auto'
    if (style.textAlign !== 'center' && style.textAlign !== 'right') {
      view.style.justifySelf = style.justifySelf;
    }
    
    // Fond
    view.style.background = style.background;

    if (isTextarea) {
      view.style.overflowY = 'auto';
      view.style.resize = style.resize;
    } else {
      view.style.overflow = 'hidden';
      view.style.whiteSpace = 'nowrap';
      view.style.alignItems = 'center';
      view.style.textOverflow = 'clip';
    }

    const val = el.value.trim();
    if (val) {
      view.innerHTML = renderMarkdown(val, !isTextarea);
      view.classList.remove('cp-md-empty');
    } else {
      const placeholder = el.placeholder || '...';
      view.innerHTML = `<div class="cp-md-placeholder">${renderMarkdown(placeholder, !isTextarea)}</div>`;
      view.classList.add('cp-md-empty');
    }
    
    el.style.display = 'none';
    // On restaure le mode d'affichage adapté en respectant le flux original
    view.style.display = isTextarea ? 'block' : (style.display.includes('inline') ? 'inline-flex' : 'flex');
  }

  function switchToEdit(el) {
    const wrapper = getWrapper(el);
    const view = wrapper.querySelector('.cp-md-view');
    
    if (el.tagName === 'TEXTAREA' && view.style.display !== 'none') {
      // On ne synchronise que la hauteur, la largeur doit rester fluide (ex: 100%)
      el.style.height = view.offsetHeight + 'px';
    }

    view.style.display = 'none';
    el.style.display = el._cp_orig_display || '';
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
      if (!el.parentElement.classList.contains('cp-md-wrapper')) {
        if (document.activeElement !== el) {
          switchToView(el);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
  window.addEventListener('load', initAll);
  setTimeout(initAll, 500);
  setTimeout(initAll, 2000);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          const targets = node.querySelectorAll ? node.querySelectorAll('textarea, input[type="text"]') : [];
          targets.forEach(el => {
            if (document.activeElement !== el) switchToView(el);
          });
          if (node.tagName === 'TEXTAREA' || (node.tagName === 'INPUT' && node.type === 'text')) {
            if (document.activeElement !== node) switchToView(node);
          }
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();
