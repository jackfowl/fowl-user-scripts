// ==UserScript==
// @name         Better Alvanista
// @namespace    http://tampermonkey.net/
// @version      2026-07-17
// @description  try to take over the world!
// @author       Jackfowl
// @match        https://www.alvanista.com/collection
// @icon         https://www.google.com/s2/favicons?sz=64&domain=alvanista.com
// @grant        none
// ==/UserScript==


(function () {
    'use strict';

    function moveActionsToTop() {
        document.querySelectorAll('.entry-drawer__actions').forEach(actions => {
            const parent = actions.parentElement;
            if (parent && parent.firstElementChild !== actions) {
                parent.insertBefore(actions, parent.firstChild);
            }
        });
    }

    // Executa ao carregar a página
    moveActionsToTop();

    // Observa mudanças no DOM (útil se o drawer é renderizado dinamicamente)
    const observer = new MutationObserver(() => {
        moveActionsToTop();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();