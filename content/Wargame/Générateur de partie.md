---
title: Préparer une bataille
---

<div id="cp-intro-app"></div>

<style>
  #cp-intro-app .cp-card {
    background: var(--lightgray); border: 1px solid var(--gray);
    border-radius: 4px; padding: 1.2em 1.4em; margin-bottom: 1.2em;
  }
  #cp-intro-app .cp-empty { color: var(--gray); font-style: italic; }

  /* ---- Tirage ---- */
  #cp-intro-app .cp-tirage-head { display: flex; justify-content: center; }
  #cp-intro-app .cp-btn {
    background: var(--secondary); color: var(--light); border: 1px solid var(--secondary);
    border-radius: 3px; padding: 0.5em 1.2em; font-family: inherit; font-variant: small-caps;
    letter-spacing: 0.05em; cursor: pointer; font-size: 0.95em;
  }
  #cp-intro-app .cp-btn:hover { opacity: 0.9; }
  #cp-intro-app .cp-btn:disabled { opacity: 0.5; cursor: wait; }
  #cp-intro-app .cp-tirage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1em; margin-top: 1em; align-items: stretch; }
  #cp-intro-app .cp-tirage-card { display: flex; flex-direction: column; text-align: center; border: 1px solid var(--gray); border-radius: 4px; padding: 0.8em; background: var(--light); }
  #cp-intro-app .cp-tirage-label { font-variant: small-caps; letter-spacing: 0.05em; font-size: 0.8em; color: var(--secondary); margin-bottom: 0.5em; }
  #cp-intro-app .cp-tirage-imgwrap { height: 210px; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5em; }
  #cp-intro-app .cp-tirage-img { max-width: 100%; max-height: 210px; border-radius: 3px; display: block; }
  #cp-intro-app .cp-tirage-noimg { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--gray); }
  #cp-intro-app .cp-tirage-noimg svg { width: 72px; height: 81px; }
  #cp-intro-app .cp-tirage-nom { font-weight: bold; color: var(--dark); }
  #cp-intro-app .cp-tirage-details {
    margin-top: 1em; text-align: left;
    border: 1px solid var(--gray); border-radius: 4px; background: var(--light);
    padding: 1em 1.2em;
  }
  #cp-intro-app .cp-tirage-desc { margin: 0 0 0.7em; font-size: 0.88em; line-height: 1.45; font-style: italic; color: var(--secondary); }
  #cp-intro-app .cp-tirage-detail { margin-bottom: 0.6em; }
  #cp-intro-app .cp-tirage-detail:last-child { margin-bottom: 0; }
  #cp-intro-app .cp-tirage-detail-lbl { display: block; font-variant: small-caps; letter-spacing: 0.04em; font-size: 0.75em; color: var(--secondary); margin-bottom: 0.15em; }
  #cp-intro-app .cp-tirage-detail p { margin: 0; font-size: 0.88em; line-height: 1.45; color: var(--dark); }

  /* ---- Génération d'intro ---- */
  #cp-intro-app .cp-intro-hint { font-size: 0.9em; color: var(--secondary); margin: 0 0 1em; line-height: 1.5; }
  #cp-intro-app .cp-section-label {
    display: block; font-variant: small-caps; letter-spacing: 0.05em;
    font-size: 0.82em; color: var(--secondary); margin: 1em 0 0.4em;
  }
  #cp-intro-app .cp-intro-camp { display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.5em; }
  #cp-intro-app .cp-intro-campnum {
    font-variant: small-caps; font-size: 0.8em; color: var(--secondary);
    min-width: 4.5em; flex-shrink: 0;
  }
  #cp-intro-app input, #cp-intro-app select {
    background: var(--light); border: 1px solid var(--gray); border-radius: 3px;
    padding: 0.45em 0.6em; font-family: inherit; font-size: 0.9em; color: var(--dark);
  }
  #cp-intro-app .cp-intro-joueur { flex: 1; min-width: 0; }
  #cp-intro-app .cp-intro-faction { flex: 1; min-width: 0; }
  #cp-intro-app .cp-intro-ambiance { width: 100%; box-sizing: border-box; }
  #cp-intro-app .cp-intro-camp-del {
    background: transparent; border: none; color: var(--gray); cursor: pointer;
    font-size: 1em; padding: 0.2em 0.4em;
  }
  #cp-intro-app .cp-intro-camp-del:hover { color: #c0563f; }
  #cp-intro-app .cp-btn-ghost {
    background: transparent; border: 1px dashed var(--gray); border-radius: 3px;
    padding: 0.35em 0.8em; font-family: inherit; font-size: 0.85em; color: var(--secondary);
    cursor: pointer; margin-top: 0.2em;
  }
  #cp-intro-app .cp-form-actions { margin-top: 1.2em; }
  #cp-intro-app .cp-msg { margin-top: 0.7em; font-size: 0.88em; min-height: 1.1em; }
  #cp-intro-app .cp-msg.err { color: #c0563f; }
  #cp-intro-app .cp-intro-loading { font-style: italic; color: var(--secondary); margin-top: 1em; }
  #cp-intro-app .cp-intro-texte {
    margin-top: 1.2em; border-left: 4px solid var(--tertiary); background: var(--light);
    border-radius: 0 4px 4px 0; padding: 1em 1.3em;
  }
  #cp-intro-app .cp-intro-texte-corps {
    font-family: Spectral, Georgia, serif; font-style: italic; font-size: 1.05em;
    line-height: 1.6; color: var(--dark);
  }
  #cp-intro-app .cp-intro-meta {
    margin-top: 0.8em; font-size: 0.75em; font-style: normal; color: var(--gray);
    border-top: 1px dashed var(--gray); padding-top: 0.5em;
  }
  @media (max-width: 500px) { #cp-intro-app .cp-tirage-grid { grid-template-columns: 1fr; } }
</style>
