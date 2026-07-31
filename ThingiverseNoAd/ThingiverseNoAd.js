// ==UserScript==
// @name         ThingiverseNoAd
// @namespace    http://tampermonkey.net/
// @version      2026-07-15
// @description  try to take over the world!
// @author       JackFowl
// @match        *://*.thingiverse.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=thingiverse.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const SELECTORS = [
        '[class*="AdCard__adCard--"]',
        '[class*="publift-widget"]',
        '[class*="ItemCardHeader__itemCardUserWrapper"]',
        '[id*="gpt_unit_"]'
    ];


    function hideAds(root = document) {
        SELECTORS.forEach(selector => {
            try {
                const ads = root.querySelectorAll(selector);
                ads.forEach(a => {
                    if (a.style.display !== 'none') {
                        a.style.setProperty('display', 'none', 'important');
                    }
                });
            } catch (e) {
                console.error(selector, e);
            }
        });
    }

    hideAds();
    const observer = new MutationObserver(() => hideAds());
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();