// ==UserScript==
// @name         Better Maker World
// @version      2026-07-15
// @description  Hide categories on new uploads
// @author       JackFowl
// @match        *://*makerworld.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=makerworld.com
// ==/UserScript==

(function() {
    'use strict';

    document.querySelectorAll('.mw-css-1580nvy').forEach(el => el.remove());
})();