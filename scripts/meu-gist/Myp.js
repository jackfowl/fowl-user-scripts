// ==UserScript==
// @name         Repaginate MYP
// @version      1.3.0
// @description  Remover a barra principal, setar foco sempre na pesquisa e reordenar as opções de raridade e idioma. Colapsar itens do carrinho na página de carrinho.
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
		if (!input) return;
        input.focus();
        input.addEventListener("input", function () {
            if (this.value.length === 4 && !this.value.endsWith("-en")) {
                this.value = this.value + "-en";
            }
        });
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

	// ── Carrinho: colapsar/expandir ────────────────────────────────────────────

	function isCarrinhoPage() {
		return window.location.pathname.endsWith("carrinho") ||
		       window.location.href.endsWith("carrinho");
	}

	function injectCarrinhoStyles() {
		if (document.getElementById("myp-carrinho-styles")) return;

		const style = document.createElement("style");
		style.id = "myp-carrinho-styles";
		style.textContent = `
			.myp-carrinho-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				cursor: pointer;
				user-select: none;
				padding: 6px 4px;
				border-radius: 4px;
				transition: background 0.15s;
			}
			.myp-carrinho-header:hover {
				background: rgba(0, 0, 0, 0.04);
			}
			.myp-carrinho-title {
				font-weight: 600;
				font-size: 0.95em;
			}
			.myp-carrinho-meta {
				font-size: 0.82em;
				color: #888;
				margin-left: 8px;
			}
			.myp-carrinho-toggle {
				font-size: 0.8em;
				color: #aaa;
				margin-left: auto;
				padding-left: 12px;
				transition: transform 0.2s;
				display: inline-block;
			}
			.myp-carrinho-toggle.collapsed {
				transform: rotate(-90deg);
			}
			.myp-carrinho-body {
				overflow: hidden;
				transition: max-height 0.25s ease, opacity 0.2s ease;
				max-height: 2000px;
				opacity: 1;
			}
			.myp-carrinho-body.collapsed {
				max-height: 0 !important;
				opacity: 0;
			}
			.myp-carrinho-controls {
				margin-bottom: 10px;
				display: flex;
				gap: 8px;
			}
			.myp-carrinho-controls button {
				font-size: 0.78em;
				padding: 2px 10px;
				cursor: pointer;
				border: 1px solid #ccc;
				border-radius: 4px;
				background: #f5f5f5;
				color: #555;
				transition: background 0.15s;
			}
			.myp-carrinho-controls button:hover {
				background: #e8e8e8;
			}
		`;
		document.head.appendChild(style);
	}

	function collapseCarrinhoItens() {
		if (!isCarrinhoPage()) return;

		injectCarrinhoStyles();

		const grupos = document.querySelectorAll(".carrinho-itens");
		if (!grupos.length) return;

		// Barra de controles globais (expandir/recolher tudo)
		const primeiroGrupo = grupos[0];
		if (!document.getElementById("myp-carrinho-controls")) {
			const controls = document.createElement("div");
			controls.id = "myp-carrinho-controls";
			controls.className = "myp-carrinho-controls";

			const btnExpandAll = document.createElement("button");
			btnExpandAll.textContent = "▼ Expandir todos";
			btnExpandAll.onclick = () => {
				document.querySelectorAll(".myp-carrinho-body").forEach(body => {
					body.classList.remove("collapsed");
				});
				document.querySelectorAll(".myp-carrinho-toggle").forEach(arrow => {
					arrow.classList.remove("collapsed");
				});
			};

			const btnCollapseAll = document.createElement("button");
			btnCollapseAll.textContent = "▶ Recolher todos";
			btnCollapseAll.onclick = () => {
				document.querySelectorAll(".myp-carrinho-body").forEach(body => {
					body.classList.add("collapsed");
				});
				document.querySelectorAll(".myp-carrinho-toggle").forEach(arrow => {
					arrow.classList.add("collapsed");
				});
			};

			controls.appendChild(btnExpandAll);
			controls.appendChild(btnCollapseAll);
			primeiroGrupo.parentElement.insertBefore(controls, primeiroGrupo);
		}

		grupos.forEach((grupo, index) => {
			// Evita processar o mesmo elemento duas vezes
			if (grupo.dataset.mypCollapsible) return;
			grupo.dataset.mypCollapsible = "1";

			// Tenta extrair um título representativo do grupo
			// Procura por nome de vendedor, loja ou qualquer título dentro do grupo
			let titulo = "";
			const nomeEl = grupo.querySelector(".carrinho-vendedor, .vendedor-nome, .store-name, h2, h3, h4, [class*='vendedor'], [class*='seller'], [class*='store']");
			if (nomeEl) {
				titulo = nomeEl.textContent.trim();
			} else {
				titulo = `Grupo ${index + 1}`;
			}

			// Conta os itens
			const itens = grupo.querySelectorAll(".carrinho-item-card");
			const qtdItens = itens.length;
			const metaTexto = qtdItens > 0 ? `${qtdItens} item${qtdItens !== 1 ? "s" : ""}` : "";

			// Cria o cabeçalho colapsável
			const header = document.createElement("div");
			header.className = "myp-carrinho-header";

			const tituloSpan = document.createElement("span");
			tituloSpan.className = "myp-carrinho-title";
			tituloSpan.textContent = titulo;

			const metaSpan = document.createElement("span");
			metaSpan.className = "myp-carrinho-meta";
			metaSpan.textContent = metaTexto;

			const toggleArrow = document.createElement("span");
			toggleArrow.className = "myp-carrinho-toggle";
			toggleArrow.textContent = "▼";

			header.appendChild(tituloSpan);
			header.appendChild(metaSpan);
			header.appendChild(toggleArrow);

			// Envolve o conteúdo original numa div colapsável
			const body = document.createElement("div");
			body.className = "myp-carrinho-body";

			// Move todos os filhos do grupo para o body
			while (grupo.firstChild) {
				body.appendChild(grupo.firstChild);
			}

			grupo.appendChild(header);
			grupo.appendChild(body);

			// Toggle ao clicar no cabeçalho
			header.addEventListener("click", () => {
				const isCollapsed = body.classList.contains("collapsed");
				if (isCollapsed) {
					body.classList.remove("collapsed");
					toggleArrow.classList.remove("collapsed");
				} else {
					body.classList.add("collapsed");
					toggleArrow.classList.add("collapsed");
				}
			});
		});
	}

	// ──────────────────────────────────────────────────────────────────────────

	function repaginate() {
		removeElements();
		adjustElements();
		setFocus();
		reorderFoilSelect();
		addFoilButton();
		reorderLanguageSelect();
		addLanguageButton();
		setFirstEdition();
		collapseCarrinhoItens();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", repaginate);
	} else {
		repaginate();
	}
})();
