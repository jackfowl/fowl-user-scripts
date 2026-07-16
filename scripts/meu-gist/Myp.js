// ==UserScript==
// @name         _AwesoMYP_
// @version      1.8.2
// @description  Remover a barra principal, setar foco sempre na pesquisa e reordenar as opções de raridade e idioma. Colapsar itens do carrinho com soma reativa de quantidades e total. Detectar itens contidos. Navegação entre carrinhos.
// @author       JackFowl
// @match        *://mypcards.com
// @match        *://mypcards.com/*
// @match        *://*.mypcards.com/*
// @icon         https://mypcards.com/android-icon-144x144.png
// ==/UserScript==
(function () {
	const CardGame = Object.freeze({ NONE: 0, YGO: 1, PKM: 2 });
	const Actions = Object.freeze({ NONE: 0, CART: 1, ORDER: 2, WISH: 3, CREATE: 4, UPDATE: 5 });
	const IDs_TO_REMOVE = "#dataenvioestoque-link, #btn-salvar-incluir, #main-menu-desktop, #main-menu-mobile, #header-spacer, #estoque-card-search";
	const CLS_TO_REMOVE = ".wishlist-quantidade, .myp-file-upload__dropzone, .estoque-create .autocomplete-icon, .estoque-update .autocomplete-icon, .header-internal, .navegacao-itens";
	const IDs_TO_REMOVE_USER = "#titulo-cards";
	const CLS_TO_REMOVE_USER = ".usuario-titulo-com-estrelas";
	const SEARCH_MAIN_OPTIONS = ["todos", "yugioh", "outros", "pokemon"];
    const YGO_FOIL_MAIN_OPTIONS = ["9", "11", "12", "13"]; // Comum, Rara, Super Rara, Ultra Rara
	const PKM_FOIL_MAIN_OPTIONS = ["1", "2", "3", "6"]; // Normal, Foil, Reverse Foil, Promo
	const LANGUAGE_MAIN_OPTIONS = ["1", "2"]; //Português, Inglês
	let tcg=CardGame.NONE;
	let action=Actions.NONE;

	const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    function wait(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

    // ⭐ FUNÇÃO wait() QUE ACEITA ABORT
    function smartWait(ms, signal) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, ms);
            if (signal) {
                signal.addEventListener('abort', () => {
                    clearTimeout(timeout);
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            }
        });
    }

    function injectAwesomeOptions() {
        if (document.getElementById("amyp-options-container")) return;
        const container = document.createElement("div");
        container.id = "amyp-options-container";

        const optAutoCompleteCodes = document.createElement("input")
        optAutoCompleteCodes.setAttribute("type", "checkbox");
        optAutoCompleteCodes.textContent = "AC Id";
    }

    function injectAwesomeStyles() {
        if (document.getElementById("amyp-card-styles")) return;

		const style = document.createElement("style");
		style.id = "amyp-card-styles";
        style.textContent = `
  .estoque-create .content-box .form .grid .btn, .estoque-update .content-box .form .grid .btn {
    margin-top: 6px;
    min-width: unset;
  }
  #header nav .search #produtoSearchForm {
    display: flex !important;
  }
  #header nav .search #produtoSearchForm .searchbar-input-wrapper {
    display: flex !important;
    flex: 1 !important;
  }
  #header nav .search #produtoSearchForm #btn-buscar {
    padding-right: 5px;
  }
  #header nav .search #produtoSearchForm #search-marca-selector {
    background-position: right 1em top 12px;
    font-size: 14px;
    min-width: 120px;
  }
  .stream .pagination {
      margin-bottom: 5px !important;
  }
  .stream .stream-organizer {
      padding: 5px 20px !important;
      margin-bottom: 5px !important;
  }
  .stream-list {
    padding-top: 5px !important;
    padding-bottom: 5px !important;
    justify-content: space-evenly !important;
  }
  .stream-list .stream-item {
    width: 200px;
    margin-top: 0px;
    margin-right: 5px;
    margin-bottom: 15px;
    margin-left: 5px;
  }
  .stream-item .card {
    padding: 0px !important;
  }
  .form-group {
    margin-bottom: 6px !important;
  }
  .main {
    padding: 6px !important;
  }
  #produto-index {
    gap: 6px !important;
  }
  .other-editions .carrossel-produtos .stream-list {
    flex-wrap: wrap !important;
  }
  .card .card-btns {
    display: block !important;
  }
  .amyp-badge {
    align-items: center;
    gap: 4px;
    border-radius: 4px;
    padding: 2px 7px;
    margin-top: 4px;
    margin-left: 8px;
    font-weight: 600;
    font-size: 14px;
    font-family: "Inter", sans-serif;
    line-height: 1.26;
  }
  .amyp-badge i {
    font-size: 0.95em;
  }
  .amyp-colecao-badge {
    color: #2e7d32;
    background: #e8f5e9;
    border: 1px solid #a5d6a7;
  }
`;
        document.head.appendChild(style);
    }

	// ── Todas: informação sobre a página atual───────────────
	function isCarrinhoPage() {
		return window.location.pathname.includes("carrinho") ||
		       window.location.href.includes("carrinho");
	}

	function isPedidoPage() {
		return window.location.pathname.includes("pedido") ||
		       window.location.href.includes("pedido");
	}

    function isDesejosPage() {
		return window.location.pathname.includes("desejos") ||
		       window.location.href.includes("desejos");
	}

	function isCreatePage() {
		return window.location.pathname.includes("create") ||
		       window.location.href.includes("create");
	}

	function isUpdatePage() {
		return window.location.pathname.includes("update") ||
		       window.location.href.includes("update");
	}

	function hasCart(){
    	return action === Actions.CART || action === Actions.ORDER;
    }

    function getCarrinhoControls(){
        return document.getElementById("amyp-carrinho-controls");
    }
    // ── Todas: ajustar layout ────────────────────────────────────────────
	function removeElements() {
		document.querySelectorAll(IDs_TO_REMOVE).forEach(el => el.remove());
		document.querySelectorAll(CLS_TO_REMOVE).forEach(el => el.remove());
		document.querySelectorAll(IDs_TO_REMOVE_USER).forEach(el => el.remove());
		document.querySelectorAll(CLS_TO_REMOVE_USER).forEach(el => el.remove());
	}

	function adjustElements() {
		const header = document.getElementById("header");
		if (header) header.style.position = "relative";
        const searchBox = document.querySelector(".searchbar-input-wrapper");
        if (searchBox){
            const btn = document.getElementById("btn-buscar");
            searchBox.append(btn);
        }
        injectAwesomeStyles();
        injectAwesomeOptions();
        if (hasCart()){
            const firstCart = document.querySelectorAll(".carrinho-da-loja")[0];
            if (firstCart){
                if (!getCarrinhoControls()) {
                    const controls = document.createElement("div");
                    controls.id = "amyp-carrinho-controls";
                    controls.className = "amyp-carrinho-controls";
                    firstCart.parentElement.insertBefore(controls, firstCart);
                }
            }
        }
        if (action == Actions.CART){
            const el = document.getElementById("enderecos");
            if (el){
                const divEl = el.parentElement.closest("div");
                const body = document.createElement("div");
                body.className = "amyp-collapsible-body collapsed";
                while (divEl.firstChild) {
                    body.appendChild(divEl.firstChild);
                }

                const header = document.createElement("div");
                header.className = "amyp-collapsible-header";
                const metaSpan = document.createElement("span");
                metaSpan.className = "amyp-collapsible-meta";
                metaSpan.textContent = "Endereço";
                const toggleArrow = document.createElement("span");
                toggleArrow.className = "amyp-collapsible-toggle collapsed";
                toggleArrow.textContent = "▼";
                header.appendChild(metaSpan);
                header.appendChild(toggleArrow);
                divEl.appendChild(header);
                divEl.appendChild(body);
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
            }
        }
	}

	function setFocus() {
		const input = document.getElementById("produtoSearchQuery");
		if (!input) return;
        input.focus();
    	input.addEventListener("input", function () {
        	switch (tcg) {
			  case CardGame.YGO:
			    if (this.value.length === 4 && !this.value.endsWith("-en")) {
			      this.value = this.value + "-en";
			    }
			    break;

			  case CardGame.PKM:
			    if (this.value.length === 3 && !this.value.endsWith("_")) {
			      this.value = this.value + "_";
			    }
			    break;
			}
        });
	}

    function setCurrentFlow() {
		let tcgElement=document.getElementById("produtoSearchForm");
		if (tcgElement){
			if (tcgElement.action.endsWith("yugioh")){
				tcg = CardGame.YGO;
            }
			else if (tcgElement.action.endsWith("pokemon")) {
				tcg = CardGame.PKM;
            }
		}
		if (tcg !== CardGame.NONE){
			if (isCarrinhoPage()){
				action = Actions.CART;
			} else if (isPedidoPage()){
				action = Actions.ORDER;
			} else if (isDesejosPage()){
				action = Actions.WISH;
			} else if (isCreatePage()){
				action = Actions.CREATE;
			} else if (isUpdatePage()){
				action = Actions.UPDATE;
			}
		}
	}

    // ── Cadastro: ajustar layout e opções mais utilizadas ────────────────────────────────────────────
	function keepUsedSearchTopics() {
		const select = document.getElementById("search-marca-selector");
		if (!select) return;

		const allOptions = Array.from(select.options);
		let available = Array.from(select.options).map(opt => opt.value);
		available = SEARCH_MAIN_OPTIONS;

		const priorityOptions = available
			.map(val => allOptions.find(opt => opt.value === val))
			.filter(Boolean);

		const otherOptions = allOptions.filter(opt => !available.includes(opt.value));

		select.innerHTML = "";

		priorityOptions.forEach(opt => select.appendChild(opt));

		select._hiddenOptions = otherOptions;
	}

    // ── Cadastro: ajustar layout e opções mais utilizadas ────────────────────────────────────────────
	function leftUsedOptions(select, mostUsed, addShowOtherOptionsTo, position) {
		if (!select || !mostUsed) return;
		const allOptions = Array.from(select.options);
		let available = mostUsed;
        if (!available) available = Array.from(select.options).map(opt => opt.value);
		const priorityOptions = available
			.map(val => allOptions.find(opt => opt.value === val))
			.filter(Boolean);
		const otherOptions = allOptions.filter(opt => !available.includes(opt.value));
		select.innerHTML = "";
		priorityOptions.forEach(opt => select.appendChild(opt));
		select._hiddenOptions = otherOptions;
        if (addShowOtherOptionsTo) addRevealOptionsButton(select, addShowOtherOptionsTo, position);
	}

	function addRevealOptionsButton(refEl, whereToEl, positionToBe) {
		if (!whereToEl) return;
        let position = positionToBe;
        if (!position) position = "afterend";
        const icon = document.createElement("i");
		icon.style.fontSize = ".75em";
		icon.className = "fas fa-plus";

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
        button.style.alignSelf = "center";
		button.onclick = () => {
			const select = refEl;
			if (!select) return;

			if (select._hiddenOptions && select._hiddenOptions.length > 0) {
				select._hiddenOptions.forEach(opt => select.appendChild(opt));
				select._hiddenOptions = [];
				button.classList.add("active");
			}
            button.remove();
		};
		button.appendChild(icon);
		whereToEl.insertAdjacentElement(position, button);
	}

	function isEstoque(){
		return action === Actions.CREATE || action === Actions.UPDATE;
	}

	function setFirstEdition(){
		if (tcg === CardGame.YGO && isEstoque()){
			const select = document.getElementById("estoque-printingestoque");
			if (!select) return;
			select.selectedIndex = 1;
		}
	}

	function setOnSale(){
		if (isEstoque()){
			const select = document.getElementById("estoque-statusestoque");
			if (!select) return;
			select.selectedIndex = 0;
		}
	}

    // ── Carrinho/Pedido: ordenar ────────────────────────────────────────────
    function sortCarrinhoItens() {
        if (action !== Actions.CART && action !== Actions.ORDER) return;

        document.querySelectorAll(".carrinho-itens").forEach(grupo => {
            const itens = Array.from(grupo.querySelectorAll(".carrinho-item-card"));
            if (itens.length < 2) return;

            const getName = el => {
                const a = el.querySelector(".carrinho-item-name a");
                return a ? a.textContent.trim().toLowerCase() : "";
            };

            itens.sort((a, b) => getName(a).localeCompare(getName(b), "pt-BR"));

            // Re-insere na ordem correta (preserva outros elementos do grupo)
            itens.forEach(item => grupo.appendChild(item));
        });
    }

	// ── Carrinho/Pedido: colapsar/expandir ────────────────────────────────────────────
	function injectCarrinhoStyles() {
		if (document.getElementById("amyp-carrinho-styles")) return;

		const style = document.createElement("style");
		style.id = "amyp-carrinho-styles";
		style.textContent = `
		    .carrinho-da-loja { padding: 4px !important; }
		    .carrinho-item-container-fix { gap: 4px !important; }
		    .carrinho-item-card { gap: 4px !important; }
            #carrinho-index .carrinho-main .carrinho-otimizador-cta {
                padding: 4px !important;
                margin-bottom: 4px !important;
            }
			.amyp-collapsible-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				cursor: pointer;
				user-select: none;
				padding: 6px 4px;
				border-radius: 4px;
				transition: background 0.15s;
                background: rgba(0, 0, 0, 0.04);
			}
			.amyp-collapsible-header:hover {
				border: 1px solid;
                border-color: #00949d;
			}
			.amyp-collapsible-meta {
				font-weight: 600;
				font-size: 0.95em;
				color: #888;
			}
            .amyp-collapsible-toggle {
				font-size: 0.8em;
				color: #aaa;
				margin-left: auto;
				padding-left: 12px;
				transition: transform 0.2s ease;
				display: inline-block;
			}
			.amyp-collapsible-body {
				overflow: hidden;
				transition: max-height 0.005s ease, opacity 0.2s ease;
				opacity: 1;
			}
			.amyp-collapsible-body.collapsed {
				max-height: 0 !important;
				opacity: 0;
			}
			.amyp-collapsible-toggle.collapsed {
                transform-origin: center bottom;
				transform: rotate(-90deg);
			}
			.amyp-carrinho-controls {
                display: grid;
                gap: 8px;
                background: #fbfcfc;
                margin-bottom: 4px !important;
			}
			.amyp-carrinho-controls button {
				padding: 2px 10px;
				cursor: pointer;
				border: 1px solid #ccc;
				border-radius: 4px;
				background: #f5f5f5;
				color: #555;
				transition: background 0.15s;
                color: #00949d;
                border-color: #00949d;
                font-weight: 500;
                font-style: normal;
                font-size: 16px;
                letter-spacing: .5px;
                gap: 4px;
                width: 24.5%
			}
            .amyp {
                text-align: center;
            }
            li.amyp {
                cursor: pointer !important;
            }
			.amyp-carrinho-controls button:hover {
				background: #e8e8e8;
			}
            .amyp-carrinho-tasks {
                display: flex;
                gap: 4px;
				flex-wrap: wrap;
				align-items: center;
				padding: 8px;
				background: #f9f9f9;
				border-radius: 4px;
				border: 1px solid #e0e0e0;
			}
            .amyp-colecao-loading {
                display: inline-block;
                font-size: 0.75em;
                color: #aaa;
                margin-top: 4px;
                margin-left: 8px;
            }
		`;
		document.head.appendChild(style);
	}

	function collapseCarrinhoItens() {
		if (!hasCart()) return;

		const grupos = document.querySelectorAll(".carrinho-itens");
		if (!grupos.length) return;

		// Barra de controles globais (expandir/recolher tudo)
        const controls = getCarrinhoControls();
		if (controls) {
			const tasksDIv = document.createElement("div");
            tasksDIv.id = "amyp-carrinho-tasks";
            tasksDIv.classList.add("amyp-carrinho-tasks");
            const btnExpandAll = document.createElement("button");
			btnExpandAll.textContent = "▼ Expandir todos";
			btnExpandAll.onclick = () => {
				document.querySelectorAll(".amyp-collapsible-body").forEach(body => {
					body.classList.remove("collapsed");
				});
				document.querySelectorAll(".amyp-collapsible-toggle").forEach(arrow => {
					arrow.classList.remove("collapsed");
				});
			};

			const btnCollapseAll = document.createElement("button");
			btnCollapseAll.textContent = "▶ Recolher todos";
			btnCollapseAll.onclick = () => {
				document.querySelectorAll(".amyp-collapsible-body").forEach(body => {
					body.classList.add("collapsed");
				});
				document.querySelectorAll(".amyp-collapsible-toggle").forEach(arrow => {
					arrow.classList.add("collapsed");
				});
			};

			tasksDIv.appendChild(btnExpandAll);
			tasksDIv.appendChild(btnCollapseAll);
			controls.append(tasksDIv);
		}

		grupos.forEach((grupo, index) => {
			// Evita processar o mesmo elemento duas vezes
			if (grupo.dataset.mypCollapsible) return;
			grupo.dataset.mypCollapsible = "1";

			// Soma as quantidades dos inputs e os totais por item
			function calcGrupoMeta(container) {
				let totalQtd = 0;
				let totalValor = 0;

                let qtdes = container.querySelectorAll("input.carrinho-item-qtd-update");
                if (qtdes && qtdes.length > 0) {
                   qtdes.forEach(input => {
                       const q = parseInt(input.value, 10);
                       if (!isNaN(q)) totalQtd += q;
                   });
                } else {
                   qtdes = container.querySelectorAll(".carrinho-detalhe-item-qtd p span.h2");
                   qtdes.forEach(span => {
                       const q = parseInt(span.textContent, 10);
                       if (!isNaN(q)) totalQtd += q;
                   });
                }
				container.querySelectorAll(".carrinho-item-valor-total").forEach(el => {
					// Texto pode ser "R$\u00a02,00" ou "R$ 2,00" — remove tudo que não seja dígito ou vírgula
					const raw = el.textContent.replace(/[^\d,]/g, "").replace(",", ".");
					const v = parseFloat(raw);
					if (!isNaN(v)) totalValor += v;
				});

				const totalFmt = totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
				return `${totalQtd} un. / ${totalFmt}`;
			}

			// Cria o cabeçalho colapsável
			const header = document.createElement("div");
			header.className = "amyp-collapsible-header";

			const metaSpan = document.createElement("span");
			metaSpan.className = "amyp-collapsible-meta";
			metaSpan.textContent = calcGrupoMeta(grupo);

			const toggleArrow = document.createElement("span");
			toggleArrow.className = "amyp-collapsible-toggle";
			toggleArrow.textContent = "▼";

			header.appendChild(metaSpan);
			header.appendChild(toggleArrow);

			// Envolve o conteúdo original numa div colapsável
			const body = document.createElement("div");
			body.className = "amyp-collapsible-body";

			// Move todos os filhos do grupo para o body
			while (grupo.firstChild) {
				body.appendChild(grupo.firstChild);
			}

			grupo.appendChild(header);
			grupo.appendChild(body);

			// Função de atualização do meta (usada pelos listeners abaixo)
			function atualizarMeta() {
				metaSpan.textContent = calcGrupoMeta(body);
			}

			// Reatividade 1: mudança de quantidade nos inputs
			body.addEventListener("input", e => {
				if (e.target.classList.contains("carrinho-item-qtd-update")) {
					atualizarMeta();
				}
			});

			// Reatividade 2: o site pode atualizar .carrinho-item-valor-total via AJAX
			// ou remover itens do DOM — MutationObserver cobre ambos
			const observer = new MutationObserver(atualizarMeta);
			observer.observe(body, {
				subtree: true,
				childList: true, // item removido
				characterData: true, // texto de valor-total atualizado inline
			});

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

	// ── Carrinho: navegação entre carrinhos ────────────────────────────────────────────
	function injectCarrinhoNavStyles() {
		if (document.getElementById("amyp-carrinho-nav-styles")) return;

		const style = document.createElement("style");
		style.id = "amyp-carrinho-nav-styles";
		style.textContent = `
			.amyp-carrinho-index {
				display: grid;
				gap: 4px;
				margin-bottom: 12px;
				flex-wrap: wrap;
				align-items: center;
				padding: 8px;
				background: #f9f9f9;
				border-radius: 4px;
				border: 1px solid #e0e0e0;
			}
			.amyp-carrinho-index-label {
				font-weight: 600;
				font-size: 0.9em;
				color: #555;
				margin-right: 8px;
			}
			.amyp-carrinho-index a {
				padding: 4px 8px;
				border-radius: 4px;
				border: 1px solid #ccc;
				background: #f5f5f5;
				color: #00949d;
				text-decoration: none;
				font-size: 0.85em;
				font-weight: 500;
				cursor: pointer;
				transition: all 0.2s;
			}
			.amyp-carrinho-index a:hover {
				background: #e8e8e8;
				border-color: #00949d;
			}
			.amyp-carrinho-index a.active {
				background: #00949d;
				color: white;
				border-color: #00949d;
			}
			.amyp-carrinho-nav-group {
				display: flex;
                margin: 2px;
				gap: 8px;
				justify-content: center;
			}
			.amyp-carrinho-nav-group a {
				padding: 6px 12px;
				border-radius: 4px;
				border: 1px solid #00949d;
				background: white;
				color: #00949d;
				text-decoration: none;
				font-size: 0.9em;
				font-weight: 500;
				cursor: pointer;
				transition: all 0.2s;
			}
			.amyp-carrinho-nav-group a:hover:not(.disabled) {
				background: #f0fafb;
			}
			.amyp-carrinho-nav-group a.disabled {
				opacity: 0.5;
				cursor: not-allowed;
				pointer-events: none;
			}
		`;
		document.head.appendChild(style);
	}

	function addCarrinhoNavigation() {
		if (action !== Actions.CART) return;

		injectCarrinhoNavStyles();

		const grupos = document.querySelectorAll(".carrinho-itens");
		if (grupos.length === 0) return;

		// Cria índice de carrinhos (barra de navegação no topo)
		const primeiroGrupo = grupos[0];
		const container = document.querySelector(".sticky-card");

		if (container && !document.getElementById("amyp-carrinho-index")) {
			const indexNav = document.createElement("div");
			indexNav.id = "amyp-carrinho-index";
			indexNav.className = "amyp-carrinho-index";

			const label = document.createElement("span");
			label.className = "amyp-carrinho-index-label";
			label.textContent = "Carrinhos:";
			indexNav.appendChild(label);

			grupos.forEach((grupo, idx) => {
				let titulo = `Carrinho ${idx + 1}`;
                const carrinho = grupo.closest(".carrinho-da-loja");
                const vendedor = carrinho.querySelector(".carrinho-vendedor-nome");
                if (vendedor) {
                    titulo = vendedor.textContent.trim();
                }
                const link = document.createElement("a");
				link.textContent = titulo;
				link.dataset.carrinhoIdx = idx;
				link.onclick = (e) => {
					e.preventDefault();
					scrollToCarrinho(idx);
					updateIndexActive(idx);
				};
				if (idx === 0) link.classList.add("active");
				indexNav.appendChild(link);
			});

			container.appendChild(indexNav);
		}

		// Adiciona navegação Anterior/Próximo em cada carrinho
		grupos.forEach((grupo, idx) => {
			if (grupo.dataset.mypNavAdded) return;
			grupo.dataset.mypNavAdded = "1";

			const navGroup = document.createElement("div");
			navGroup.className = "amyp-carrinho-nav-group";

			// Botão Anterior
			const btnAnterior = document.createElement("a");
			btnAnterior.textContent = "← Carrinho Anterior";
			btnAnterior.onclick = (e) => {
				e.preventDefault();
				if (idx > 0) {
					scrollToCarrinho(idx - 1);
					updateIndexActive(idx - 1);
				}
			};
			if (idx === 0) {
				btnAnterior.classList.add("disabled");
			}

			// Botão Próximo
			const btnProximo = document.createElement("a");
			btnProximo.textContent = "Próximo Carrinho →";
            if (idx === grupos.length - 1) {
                btnProximo.textContent = "Primeiro Carrinho ⇈";
            }
			btnProximo.onclick = (e) => {
				e.preventDefault();
				if (idx < grupos.length - 1) {
					scrollToCarrinho(idx + 1);
					updateIndexActive(idx + 1);
				} else{
                    scrollToCarrinho(0);
					updateIndexActive(0);
                }
			};

			navGroup.appendChild(btnAnterior);
			navGroup.appendChild(btnProximo);

			// Insere ao comeco do carrinho do grupo
            const carrinho = grupo.closest(".carrinho-da-loja");
            carrinho.insertBefore(navGroup, carrinho.querySelector(".box-titulo-com-botao"));
		});

		function scrollToCarrinho(idx) {
			const grupo = grupos[idx];
			if (grupo) {
				grupo.parentElement.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		}

		function updateIndexActive(idx) {
			document.querySelectorAll(".amyp-carrinho-index a[data-carrinho-idx]").forEach((link, i) => {
				link.classList.toggle("active", i === idx);
			});
		}
	}

	// ── Carrinho: avaliar existencia na colecao────────────────────────────────
    function injectColecaoStyles() {
        if (document.getElementById("amyp-colecao-styles")) return;

        const style = document.createElement("style");
        style.id = "amyp-colecao-styles";
        style.textContent = `
        .amyp-colecao-loading {
            display: inline-block;
            font-size: 0.75em;
            color: #aaa;
            margin-top: 4px;
            margin-left: 8px;
        }
    `;
        document.head.appendChild(style);
    }

    async function getCardsAndamento(){
        const cards = [];
        const span = document.querySelector("#user-nav-toggle .hidden-sm");
        if (span) {
            const doc = await getDoc(`${window.location.origin}/${span.textContent.trim()}/compras`);
            if(doc) {
                const pedidos = [...doc.querySelectorAll("tbody tr")]
                const andamento = pedidos.filter(p => !(p.querySelector(".statuspedido").textContent.toLowerCase().startsWith("recebido") || false));
                for (const a of andamento){
                    for (let i = 1; i <= 3; i++) {
                        try {
                            const p = await getDoc(`${window.location.origin}/pedido/${a.dataset.key}`);
                            const pc = Array.from(p.querySelectorAll(".carrinho-item-name a")).map(c => c.textContent.trim());
                            cards.push(...pc);
                            break;
                        } catch {
                            await wait(1000 * i);
                        }
                    }
                }
            }
        }
        return cards;
    }

    async function getCarrinhoKeys(){
        let cards = [];
        const doc = await getDoc(`${window.location.origin}/carrinho`);
        if(doc) {
            cards = [...doc.querySelectorAll(".carrinho-item-name a")].map(c => c.textContent.trim());
        }
        return cards;
    }

    function addColecaoButton() {
        let controlsEl;
        if (hasCart()) {
            const container = getCarrinhoControls();
			if (container) {
				controlsEl = container.querySelector(".amyp-carrinho-tasks");
			}
        } else if (action === Actions.WISH) {
            controlsEl = document.querySelector("ul.pagination");
        }
        if (!controlsEl) return;
        injectColecaoStyles();
        injectDuplicateStyles();

        let abortController = null;
        const btn = document.createElement(hasCart() ? "button": "li");
        btn.id = "myp-btn-colecao";
        btn.className = "amyp";
        btn.textContent = " 🔍 ";
        btn.title = "Verificar coleção";
        btn.onclick = async () => {
            // Se já está rodando, para
            if (abortController) {
                console.log("Asked to abort");
                abortController.abort();
                abortController = null;
                return;
            }

            abortController = new AbortController();
            const currentColor = btn.style.color; // ⭐ CAPTURA AQUI DENTRO
            btn.textContent = "⏹";
            btn.title = "Parar";

            try {
                let itens = [];
                if (hasCart()) {
                    itens = Array.from(document.querySelectorAll(".carrinho-item-card"));
                } else {
                    itens = Array.from(document.querySelectorAll("div.card"));
                }
                const total = itens.length;
                if (total === 0) {
                    btn.textContent = "Sem itens";
                    btn.disabled = false;
                    abortController = null;
                    return;
                }

                let cardsAndamento = await getCardsAndamento();
                let cardsCarrinho = [];
                if (action != Actions.CART) cardsCarrinho = [...await getCarrinhoKeys()];
                let time = 100;
                let done = 0;
                const keys = itens.map(el => getColecaoItemKey(el));
                let idx = 0;
                let fails = 0;
                let cache = loadColecaoCache();
                for (const item of itens) {
                    // ⭐ VERIFICA SE FOI SOLICITADO PARAR
                    if (!abortController || abortController.signal.aborted) {
                        console.log("Parado pelo usuário");
                        btn.textContent = "⚠️ Parado";
                        btn.style.color = "orange";
                        setTimeout(() => {
                            btn.textContent = "🔍 Verificar coleção";
                            btn.style.color = currentColor;
                            btn.disabled = false;
                        }, 1500);
                        return;
                    }

                    const currentKey = getColecaoItemKey(item);
                    btn.textContent = `${Math.trunc(done/total*100)}%`;
                    if (action === Actions.WISH){
                        if (cardsCarrinho.filter(c=> c == currentKey).lenght > 0) markBoughtItem(item);
                    }
                    if (hasCart()){
                        const duplicates = keys.filter(n => n === currentKey).length;
                        if (duplicates > 1) {
                            markDuplicateItem(item, idx, duplicates);
                        }
                    }
                    if (cardsAndamento.includes(currentKey)) {
                        markBoughtItem(item);
                    }

                    const t = randomInt(500, 750);
                    const r = await checkColecaoItem(item, cache);
                    if (r && r.failed) {
                        time += t;
                        console.log(`🔍 Aguardando... ${time}ms`);
                        // ⭐ PASSA O SIGNAL PARA CANCELAR O WAIT
                        try {
                            await smartWait(time, abortController.signal || null);
                        } catch (e) {
                            if (e.name === 'AbortError') {
                                return; // Sai do loop imediatamente
                            }
                        }
                        time -= Math.floor(t / randomInt(1, 3));
                        fails++;
                    } else {
                        // ⭐ PASSA O SIGNAL AQUI TAMBÉM
                        try {
                            await smartWait(randomInt(0, 5), abortController.signal || null);
                        } catch (e) {
                            if (e.name === 'AbortError') {
                                return; // Sai do loop imediatamente
                            }
                        }
                    }
                    idx++;
                    done++;
                }

                // Completou com sucesso
                btn.textContent = "✔";
                let timeOut = 2000;
                if (fails > 0) {
                    timeOut = 3000;
                    btn.style.color = "red";
                    btn.textContent = "✗";
                }
                setTimeout(() => {
                    btn.textContent = "🔍";
                    btn.style.color = currentColor;
                    btn.disabled = false;
                }, timeOut);

            } catch (error) {
                console.error("Erro:", error);
                btn.textContent = "✗";
                btn.style.color = currentColor;
                btn.disabled = false;
            } finally {
                abortController = null;
            }
        };

        const btnLimpar = document.createElement(hasCart() ? "button": "li");
        btnLimpar.textContent = "🗑";
        btnLimpar.title = "Limpar cache";
        btnLimpar.className = "amyp";
        btnLimpar.onclick = () => {
            localStorage.removeItem(COLECAO_KEY);
            btnLimpar.textContent = "✔";
            setTimeout(() => { btnLimpar.textContent = "🗑"; }, 1000);
        };

        controlsEl.appendChild(btn);
        controlsEl.appendChild(btnLimpar);
    }

    const COLECAO_KEY = "myp-colecao-checked";

    function loadColecaoCache() {
        try {
            return JSON.parse(localStorage.getItem(COLECAO_KEY) || "{}");
        } catch {
            return {};
        }
    }

    function saveColecaoCache(cache) {
        try {
            localStorage.setItem(COLECAO_KEY, JSON.stringify(cache));
        } catch {}
    }

    function getColecaoItemKey(itemEl) {
        let anchor = itemEl.querySelector(".carrinho-item-name a");
        if (!anchor) anchor = itemEl.querySelector(".card-name h3");
        if (!anchor) return null;
        return anchor.textContent.trim();
    }

    async function getDoc(href) {
        const response = await fetch(href, { credentials: "include" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        const parser = new DOMParser();
        return parser.parseFromString(html, "text/html");
    }

    function getQuantidadeItem(doc){
        let qtd = 0;
        const qtdeEl = doc.querySelectorAll('.minha-colecao td.estoque-lista-quantidadeestoque');
        for (const q of qtdeEl){
            qtd += parseInt(q.textContent.split(" ")[0], 10);
        }
        return qtd;
    }

    function getElementsToUse(itemEl){
        let anchor;
        let toBadge;
        if (hasCart()){
            anchor = itemEl.querySelector(".carrinho-item-name a");
            if (!anchor) return {err: "not found anchor"};
            const nameEl = itemEl.querySelector(".carrinho-item-name");
            toBadge = nameEl.querySelector("p");
        }else{
            anchor = itemEl.querySelector(".card-btns a");
            toBadge = anchor;
        }
        return {anchor, toBadge};
    }

    async function checkColecaoItem(itemEl, cache) {
        let naColecao = {qtde: 0, wished: false, multiplas: false, failed: false, ignored: false};
        const isLater = itemEl.closest(".carrinho-mais-tarde");
        if (isLater) { naColecao.ignored = true; return naColecao; }
        const elToUse = getElementsToUse(itemEl);
        if (!elToUse || !elToUse.toBadge) { console.log("checkColecaoItem no El");return;}
        const key = getColecaoItemKey(itemEl);

        const loading = document.createElement("span");
        loading.className = "amyp-colecao-loading";
        loading.innerHtml = `i class="fas fa-clock"></i>`;
        elToUse.toBadge.appendChild(loading);

        if (key && key in cache && cache[key]) {
            naColecao = cache[key];
        } else {
            try {
                let time = 100;
                for (let mainTries = 1; mainTries <= 3; mainTries++){
                    const mainT = randomInt(500, 1250) * mainTries;
                    try {
                        const doc = await getDoc(elToUse.anchor.href);
                        naColecao.qtde = getQuantidadeItem(doc);
                        naColecao.wished = Array.from(doc.querySelectorAll(".heart-remove")).length > 0;
                        const outros = doc.querySelectorAll("i.fas.fa-book-open.fa-1x");
                        if (outros.length > 0) {
                            await wait(time);
                            naColecao.multiplas = true;
                            for (const i of outros){
                                for (let internalTries = 0; internalTries <= 3;internalTries++){
                                    const outroT = randomInt(500, 1000) * internalTries;
                                    try {
                                        const subDoc = await getDoc(i.parentElement.href);
                                        naColecao.qtde += getQuantidadeItem(subDoc);
                                        break;
                                    } catch (err) {
                                        if (internalTries == 3) {
                                            throw(err);
                                        }
                                        time += outroT;
                                        await wait(time);
                                    }
                                    time -= Math.floor(outroT / randomInt(1, 3));
                                }
                            }
                        }
                        if (key) {
                            cache[key] = naColecao;
                            saveColecaoCache(cache);
                        }
                        break;
                    } catch (err){
                        if (naColecao.multiplas){
                            throw(err);
                        }
                        if (mainTries == 3) {
                            throw(err);
                        }
                        time += mainT;
                        await wait(time);
                        time -= Math.floor(mainT / randomInt(1, 3));
                    }
                }
            } catch (err) {
                naColecao.total = 0;
                naColecao.wished = false;
                naColecao.failed = true;
                loading.textContent = "erro ao verificar";
                console.warn("[AwesoMYP] checkColecaoItem falhou:", elToUse.anchor.textContent);
            }
        }

        if (!naColecao.failed) {
        	loading.remove();
        }

        if (hasCart() && naColecao.wished) {
            const exists = elToUse.toBadge.querySelector(".amyp-wished-badge");
            if (!exists){
                const badge = document.createElement("span");
                badge.className = "amyp-badge amyp-wished-badge";
                badge.innerHTML = `<i class="fas fa-heart"></i>`;
                elToUse.toBadge.appendChild(badge);
            }
        }
        if (naColecao.qtde > 0) {
            const exists = elToUse.toBadge.querySelector(".amyp-colecao-badge");
            if (!exists){
                const badge = document.createElement("span");
                badge.className = "amyp-badge amyp-colecao-badge";
                badge.innerHTML = `<i class="fas fa-book-open"></i> ${naColecao.qtde}${naColecao.multiplas ? "*" : ""}`;
                elToUse.toBadge.appendChild(badge);
            }
        }
        return naColecao;
    }

    // ── Carrinho: detectar itens contidos ────────────────────────────────────────────
    function injectDuplicateStyles() {
        if (document.getElementById("amyp-duplicated-styles")) return;

        const style = document.createElement("style");
        style.id = "amyp-duplicated-styles";
        style.textContent = `
        .amyp-wished-badge {
            color: #A31F55;
            background: #FBCFE8;
            border: 1px solid #A31F55;
        }
        .amyp-bought-badge {
            color: #FFA500;
            background: #F0E68C;
            border: 1px solid #FFA500;
        }
        .amyp-duplicated-badge {
            color: #d9534f;
            background: #fdeae8;
            border: 1px solid #d9534f;
        }
        .amyp-duplicated-link {
            color: #d9534f;
            text-decoration: none;
            display: inline-block; /* garante que o <a> tenha caixa própria */
        }
        .amyp-duplicated-link * {
            pointer-events: none;
        }
    `;
        document.head.appendChild(style);
    }

    function scrollToNextDuplicateFrom(itemEl) {
        let el = itemEl;
        if (el.tagName.toLowerCase() === "i"){
            el = el.closest(".amyp-duplicated-link");
        }
        const linksEl = [...document.querySelectorAll(".amyp-duplicated-link")];
        if (!linksEl) { return; }
        const links = linksEl.filter(l => l.dataset.name === el.dataset.name);
        if (links.length > 0) {
            const after = links.filter(l => parseInt(l.dataset.idx) > parseInt(el.dataset.idx));
            let elToScroll = links[0].closest(".carrinho-item-card");
            if (after.length > 0) {
                elToScroll = after[0].closest(".carrinho-item-card");
            }
            elToScroll.scrollIntoView({ behavior: "smooth", block: "center" });
            const color = elToScroll.style.color;
            elToScroll.style.color = "#d9534f";
            setTimeout(() => { elToScroll.style.color = color; }, 1000);
        }
    }

    function markDuplicateItem(itemEl, idx, qty) {
        const nameEl = itemEl.querySelector(".carrinho-item-name");
        if (!nameEl) return;

        // Verifica se já foi marcado
        if (nameEl.querySelector(".amyp-duplicated-badge")) return;

        const nameP = nameEl.querySelector("p");
        if (!nameP) return;

        const badge = createBadge("span", "amyp-duplicated-badge", "shopping-cart", `&nbsp;${qty}`, "Múltiplos itens");
        const link = document.createElement("a");
        link.classList.add("amyp-duplicated-link");
        link.dataset.idx = idx;
        link.dataset.name = nameP.textContent;
        link.onclick = (e) => {
            e.preventDefault();
            scrollToNextDuplicateFrom(e.target);
        };
        link.appendChild(badge);
        nameP.appendChild(link);
    }

    function markBoughtItem(itemEl){
        const elToUse = getElementsToUse(itemEl);
        if (!elToUse || !elToUse.toBadge) return;

        // Verifica se já foi marcado
        if (elToUse.toBadge.querySelector(".amyp-bought-badge")) return;

        const badge = createBadge("span", "amyp-bought-badge", "truck", null, "Compra em andamento");
        elToUse.toBadge.appendChild(badge);
    }

    function createBadge(elType, className, icon, text, title)
    {
        const badge = document.createElement(elType);
        badge.className = `amyp-badge ${className}`;
        badge.innerHTML = `<i class="fas fa-${icon}"></i>${text ? text : ""}`;
        badge.title = title;
        return badge;
    }

    // ── Repaginar────────────────────────────────────────────────────────────────

	function repaginate() {
		setCurrentFlow();
        injectCarrinhoStyles();
		removeElements();
		adjustElements();
        let mostUsedRarityVersion;
		if (action === Actions.CREATE) {
            if (tcg === CardGame.YGO) {
                mostUsedRarityVersion = YGO_FOIL_MAIN_OPTIONS;
            }
            else if (tcg === CardGame.PKM) {
                mostUsedRarityVersion = PKM_FOIL_MAIN_OPTIONS;
            }
            leftUsedOptions(document.getElementById("estoque-idfoil"), mostUsedRarityVersion, document.querySelector(".field-estoque-idfoil label"), "beforeend");
            leftUsedOptions(document.getElementById("estoque-ididioma"), LANGUAGE_MAIN_OPTIONS, document.querySelector(".field-estoque-ididioma label"), "beforeend");
            setFirstEdition();
        }
        leftUsedOptions(document.getElementById("search-marca-selector"), SEARCH_MAIN_OPTIONS, document.getElementById("search-marca-selector"), "afterend");
		setOnSale();
        sortCarrinhoItens();
        collapseCarrinhoItens();
        addColecaoButton();
        addCarrinhoNavigation();
        setFocus();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", repaginate);
	} else {
		repaginate();
	}
})();