/* ============================================================
   C&P — Bouton flottant de signalement (cp-bug-report)
   À placer dans : quartz/static/cp-bug-report.css
   Chargé globalement via Head.tsx (le bouton apparaît sur toutes les pages).
   Les valeurs de repli (ex. #6b3f2a) couvrent le cas où les variables
   Quartz ne seraient pas encore disponibles.
   ============================================================ */

#cp-bug-fab {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
  width: 3.2rem; height: 3.2rem; border-radius: 50%;
  background: var(--secondary, #6b3f2a); color: var(--light, #f4ecdd);
  border: 1px solid var(--gray, #8a7a5c);
  box-shadow: 0 3px 10px rgba(0,0,0,0.3);
  font-family: Georgia, serif; font-size: 1.4rem;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s, opacity 0.15s;
}
#cp-bug-fab:hover { opacity: 0.88; transform: scale(1.05); }

#cp-bug-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(20,16,12,0.55);
  display: none; align-items: center; justify-content: center;
}
#cp-bug-overlay.open { display: flex; }

#cp-bug-modal {
  background: var(--lightgray, #f4ecdd); color: var(--dark, #2b2520);
  border: 1px solid var(--gray, #8a7a5c); border-radius: 5px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
  width: min(420px, 92vw); padding: 1.4em 1.6em;
  font-family: Georgia, "Times New Roman", serif;
}
#cp-bug-modal h3 {
  margin: 0 0 0.6em; font-variant: small-caps; letter-spacing: 0.04em;
  color: var(--dark, #2b2520);
  border-bottom: 2px solid var(--gray, #8a7a5c); padding-bottom: 0.3em;
}
#cp-bug-modal label {
  display: block; font-variant: small-caps; font-size: 0.82em;
  letter-spacing: 0.05em; color: var(--secondary, #6b3f2a); margin: 0.7em 0 0.25em;
}
#cp-bug-modal input, #cp-bug-modal textarea, #cp-bug-modal select {
  width: 100%; box-sizing: border-box; background: var(--light, #fffdf8);
  border: 1px solid var(--gray, #8a7a5c); border-radius: 3px;
  padding: 0.5em 0.65em; font-family: inherit; font-size: 0.92em; color: var(--dark, #2b2520);
}
#cp-bug-modal textarea { min-height: 110px; resize: vertical; line-height: 1.5; }
#cp-bug-page {
  font-size: 0.8em; color: var(--secondary, #6b3f2a); font-style: italic;
  margin: 0.7em 0 0; word-break: break-all;
}
.cp-bug-actions { display: flex; gap: 0.6em; margin-top: 1.1em; }
.cp-bug-btn {
  flex: 1; border: 1px solid var(--gray, #8a7a5c); border-radius: 3px;
  padding: 0.55em 1em; font-family: inherit; font-variant: small-caps;
  letter-spacing: 0.05em; font-size: 0.9em; cursor: pointer;
}
.cp-bug-btn.primary { background: var(--secondary, #6b3f2a); color: var(--light, #f4ecdd); }
.cp-bug-btn.primary:hover { opacity: 0.88; }
.cp-bug-btn.primary:disabled { opacity: 0.5; cursor: wait; }
.cp-bug-btn.ghost { background: transparent; color: var(--secondary, #6b3f2a); }
#cp-bug-link {
  display: block; margin-top: 0.9em; font-size: 0.8em; text-align: center;
  color: var(--secondary, #6b3f2a);
}
.cp-bug-msg { margin-top: 0.7em; font-size: 0.85em; min-height: 1.1em; }
.cp-bug-msg.ok { color: var(--tertiary, #3a6b2a); }
.cp-bug-msg.err { color: #c0563f; }
