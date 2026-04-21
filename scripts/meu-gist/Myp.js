// ==UserScript==
// @name         Repaginate MYP
// @version      1.2.0
// @description  Remover a barra principal, setar foco sempre na pesquisa e reordenar as opções de raridade e idioma.
// @author       JackFowl
// @match        *://mypcards.com
// @match        *://mypcards.com/*
// @match        *://*.mypcards.com/*
// @icon         https://mypcards.com/android-icon-144x144.png
// ==/UserScript==

(function () {
	const SELECTORS = "#main-menu-desktop, #main-menu-mobile, #header-spacer";
	const FOIL_MAIN_OPTIONS = ["9", "11", "12", "13"]; // Comum, Rara, Super Rara, Ultra Rara
	const LANGUAGE_MAIN_OPTIONS = ["1", "2"]; //Português, Inglês

	function removeElements() {
		document.querySelectorAll(SELECTORS).forEach(el => el.remove());
	}

	function adjustElements() {
		const header = document.getElementById("header");
		if (header) header.style.position = "relative";
	}

	function setFocus() {
		const input = document.getElementById("produtoSearchQuery");
		if (input) input.focus();
	}

	function reorderFoilSelect() {
		const select = document.getElementById("estoque-idfoil");
		if (!select) return;

		const allOptions = Array.from(select.options);

		const priorityOptions = FOIL_MAIN_OPTIONS
			.map(val => allOptions.find(opt => opt.value === val))
			.filter(Boolean);

		const otherOptions = allOptions.filter(opt => !FOIL_MAIN_OPTIONS.includes(opt.value));

		select.innerHTML = "";

		priorityOptions.forEach(opt => select.appendChild(opt));

		select._hiddenOptions = otherOptions;
	}

	function addFoilButton() {
		const label = document.querySelector(".field-estoque-idfoil label");
		if (!label) return;

		const button = document.createElement("button");
		button.type = "button";
		button.className = "btn btn-outline btn-icon btn-rounded btn-hint";
		button.style.height = "1.2em";
		button.style.alignContent = "center";
		button.style.alignItems = "center";
		button.style.display = "inline-flex";
		button.style.justifyContent = "center";
		button.style.margin = "0 0 0 4px";
		button.style.padding = "0";

		button.onclick = () => {
			const select = document.getElementById("estoque-idfoil");
			if (!select) return;

			if (select._hiddenOptions && select._hiddenOptions.length > 0) {
				select._hiddenOptions.forEach(opt => select.appendChild(opt));
				select._hiddenOptions = [];
				button.classList.add("active");
			}
		};

		const icon = document.createElement("i");
		icon.style.fontSize = ".75em";
		icon.className = "fas fa-plus";

		button.appendChild(icon);
		label.appendChild(button);
	}
	
	function reorderLanguageSelect() {
		const select = document.getElementById("estoque-ididioma");
		if (!select) return;

		const allOptions = Array.from(select.options);

		const priorityOptions = LANGUAGE_MAIN_OPTIONS
			.map(val => allOptions.find(opt => opt.value === val))
			.filter(Boolean);

		const otherOptions = allOptions.filter(opt => !LANGUAGE_MAIN_OPTIONS.includes(opt.value));

		select.innerHTML = "";

		priorityOptions.forEach(opt => select.appendChild(opt));

		select._hiddenOptions = otherOptions;
	}
	
	function addLanguageButton() {
		const label = document.querySelector(".field-estoque-ididioma label");
		if (!label) return;

		const button = document.createElement("button");
		button.type = "button";
		button.className = "btn btn-outline btn-icon btn-rounded btn-hint";
		button.style.height = "1.2em";
		button.style.alignContent = "center";
		button.style.alignItems = "center";
		button.style.display = "inline-flex";
		button.style.justifyContent = "center";
		button.style.margin = "0 0 0 4px";
		button.style.padding = "0";

		button.onclick = () => {
			const select = document.getElementById("estoque-ididioma");
			if (!select) return;

			if (select._hiddenOptions && select._hiddenOptions.length > 0) {
				select._hiddenOptions.forEach(opt => select.appendChild(opt));
				select._hiddenOptions = [];
				button.classList.add("active");
			}
		};

		const icon = document.createElement("i");
		icon.style.fontSize = ".75em";
		icon.className = "fas fa-plus";

		button.appendChild(icon);
		label.appendChild(button);
	}
	
	function setFirstEdition(){
		const select = document.getElementById("estoque-printingestoque");
		if (!select) return;
		select.selectedIndex = 1;
	}

	function repaginate() {
		removeElements();
		adjustElements();
		setFocus();
		reorderFoilSelect();
		addFoilButton();
		reorderLanguageSelect();
		addLanguageButton();
		setFirstEdition();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", repaginate);
	} else {
		repaginate();
	}
})();ntById("modal-qualidade-cartas");
	    if (modal) modal.classList.add("open");
	};
	
	  const icon = document.createElement("i");
	  icon.style.fontSize = ".75em";
	  icon.className = "fas fa-plus";
	
	  button.appendChild(icon);
	  label.appendChild(button);
	}

  function repaginate() {
    removeElements();
    adjustElements();
    setFocus();
    reorderSelect();
    addHintButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", repaginate);
  } else {
    repaginate();
  }
})();