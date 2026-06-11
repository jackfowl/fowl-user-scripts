// ==UserScript==
// @name         _AwesoMYP_
// @version      1.6.0
// @description  Remover a barra principal, setar foco sempre na pesquisa e reordenar as opções de raridade e idioma. Colapsar itens do carrinho com soma reativa de quantidades e total.
// @author       JackFowl
// @match        *://mypcards.com
// @match        *://mypcards.com/*
// @match        *://*.mypcards.com/*
// @icon         https://mypcards.com/android-icon-144x144.png
// ==/UserScript==

(function () {
	const Actions = Object.freeze({ NONE: 0, YGO: 1, PKM: 2 });
	const IDs_TO_REMOVE = "#main-menu-desktop, #main-menu-mobile, #header-spacer, #zestoque-card-search";
	const CLS_TO_REMOVE = ".estoque-create .autocomplete-icon, .estoque-update .autocomplete-icon, .header-internal, .navegacao-itens";
	const YGO_FOIL_MAIN_OPTIONS = ["9", "11", "12", "13"]; // Comum, Rara, Super Rara, Ultra Rara
	const PKM_FOIL_MAIN_OPTIONS = ["1", "2", "3", "6"]; // Normal, Foil, Reverse Foil, Promo
	const LANGUAGE_MAIN_OPTIONS = ["1", "2"]; //Português, Inglês
	let action=Actions.NONE;

    // ── Todas: ajustar layout ────────────────────────────────────────────
	function removeElements() {
		document.querySelectorAll(IDs_TO_REMOVE).forEach(el => el.remove());
		document.querySelectorAll(CLS_TO_REMOVE).forEach(el => el.remove());
	}

	function adjustElements() {
		const header = document.getElementById("header");
		if (header) header.style.position = "relative";
        injectCardStyles();
	}

	function setFocus() {
		const input = document.getElementById("produtoSearchQuery");
		if (!input) return;
        input.focus();
    	input.addEventListener("input", function () {
        	switch (action) {
			  case Actions.YGO:
			    if (this.value.length === 4 && !this.value.endsWith("-en")) {
			      this.value = this.value + "-en";
			    }
			    break;

			  case Actions.PKM:
			    if (this.value.length === 3 && !this.value.endsWith("_")) {
			      this.value = this.value + "_";
			    }
			    break;
			}
        });
	}

    function setCurrentAction() {
		let actionElement=document.getElementById("produtoSearchForm");
		if (actionElement){
			if (actionElement.action.endsWith("yugioh")){
				action = Actions.YGO;
            }
			else if (actionElement.action.endsWith("pokemon")) {
				action = Actions.PKM;
            }
		}
	}

    // ── Cadastro: ajustar layout e opções mais utilizadas ────────────────────────────────────────────
	function reorderFoilSelect() {
		const select = document.getElementById("estoque-idfoil");
		if (!select) return;

		const allOptions = Array.from(select.options);
		let available = Array.from(select.options).map(opt => opt.value);
		if (action === Actions.YGO) {
			available = YGO_FOIL_MAIN_OPTIONS;
        }
		else if (action === Actions.PKM) {
			available = PKM_FOIL_MAIN_OPTIONS;
        }

		const priorityOptions = available
			.map(val => allOptions.find(opt => opt.value === val))
			.filter(Boolean);

		const otherOptions = allOptions.filter(opt => !available.includes(opt.value));

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
		if (action === Actions.YGO){
			const select = document.getElementById("estoque-printingestoque");
			if (!select) return;
			select.selectedIndex = 1;
		}
	}

    // ── Carrinho/Pedido: ordenar ────────────────────────────────────────────
    function sortCarrinhoItens() {
        if (!isCarrinhoPage()) return;

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

	function isCarrinhoPage() {
		return window.location.pathname.includes("carrinho") ||
               window.location.pathname.includes("pedido") ||
		       window.location.href.includes("carrinho");
	}

    function injectCardStyles() {
        if (document.getElementById("myp-card-styles")) return;

		const style = document.createElement("style");
		style.id = "myp-card-styles";
        style.textContent = `
  .other-editions .carrossel-produtos .stream-list {
    flex-wrap: wrap !important;
  }
  .card .card-btns {
    display: block !important;
  }
`;
        document.head.appendChild(style);
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
            addColecaoButton(controls);
			primeiroGrupo.parentElement.insertBefore(controls, primeiroGrupo);
		}

		grupos.forEach((grupo, index) => {
			// Evita processar o mesmo elemento duas vezes
			if (grupo.dataset.mypCollapsible) return;
			grupo.dataset.mypCollapsible = "1";

		    let titulo = `Grupo ${index + 1}`;

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
			header.className = "myp-carrinho-header";

			const tituloSpan = document.createElement("span");
			tituloSpan.className = "myp-carrinho-title";
			tituloSpan.textContent = titulo;

			const metaSpan = document.createElement("span");
			metaSpan.className = "myp-carrinho-meta";
			metaSpan.textContent = calcGrupoMeta(grupo);

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

	// ── Carrinho: avaliar existencia na colecao────────────────────────────────
    function injectColecaoStyles() {
        if (document.getElementById("myp-colecao-styles")) return;

        const style = document.createElement("style");
        style.id = "myp-colecao-styles";
        style.textContent = `
        .myp-colecao-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 0.75em;
            color: #2e7d32;
            background: #e8f5e9;
            border: 1px solid #a5d6a7;
            border-radius: 4px;
            padding: 2px 7px;
            margin-top: 4px;
            margin-left: 8px;
        }
        .myp-colecao-badge i {
            font-size: 0.95em;
        }
        .myp-colecao-loading {
            display: inline-block;
            font-size: 0.75em;
            color: #aaa;
            margin-top: 4px;
            margin-left: 8px;
        }
    `;
        document.head.appendChild(style);
    }

    function addColecaoButton(controlsEl) {
        injectColecaoStyles();

        const btn = document.createElement("button");
        btn.id = "myp-btn-colecao";
        btn.textContent = "🔍 Verificar coleção";
        btn.onclick = async () => {
            btn.disabled = true;

            const itens = Array.from(document.querySelectorAll(".carrinho-item-card"));
            const total = itens.length;

            if (total === 0) {
                btn.textContent = "✔ Já verificado";
                return;
            }

            let done = 0;
            for (const item of itens) {
                await checkColecaoItem(item);
                done++;
                btn.textContent = `🔍 Verificando... (${done}/${total})`;
            }

            btn.textContent = "✔ Coleção verificada";
        };

        const btnLimpar = document.createElement("button");
        btnLimpar.textContent = "🗑 Limpar cache";
        btnLimpar.onclick = () => {
            sessionStorage.removeItem(COLECAO_KEY);
            btnLimpar.textContent = "✔ Cache limpo";
            setTimeout(() => { btnLimpar.textContent = "🗑 Limpar cache"; }, 2000);
        };

        controlsEl.appendChild(btn);
        controlsEl.appendChild(btnLimpar);
    }

    const COLECAO_KEY = "myp-colecao-checked";

    function loadColecaoCache() {
        try {
            return JSON.parse(sessionStorage.getItem(COLECAO_KEY) || "{}");
        } catch {
            return {};
        }
    }

    function saveColecaoCache(cache) {
        try {
            sessionStorage.setItem(COLECAO_KEY, JSON.stringify(cache));
        } catch {}
    }

    function getColecaoItemKey(itemEl) {
        const anchor = itemEl.querySelector(".carrinho-item-name a");
        if (!anchor) return null;
        return anchor.textContent.trim();
    }

    async function checkColecaoItem(itemEl) {
        const anchor = itemEl.querySelector(".carrinho-item-name a");
        if (!anchor) return;

        const key = getColecaoItemKey(itemEl);
        const nameEl = itemEl.querySelector(".carrinho-item-name");
        if (!nameEl) return;
        const nameP = nameEl.querySelector("p");
        const cache = loadColecaoCache();

        if (key && key in cache) {
            if (cache[key]) {
                const badge = document.createElement("span");
                badge.className = "myp-colecao-badge";
                badge.innerHTML = `<i class="fas fa-book-open"></i> Na coleção`;
                nameP.appendChild(badge);
            }
            return;
        }

        const loading = document.createElement("span");
        loading.className = "myp-colecao-loading";
        loading.textContent = "verificando...";
        nameP.appendChild(loading);

        try {
            const response = await fetch(anchor.href, { credentials: "include" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            const naColecao = !!doc.querySelector("i.fas.fa-book-open.fa-1x") ||
                  !!doc.querySelector("div.minha-colecao");

            loading.remove();

            if (key) {
                cache[key] = naColecao;
                saveColecaoCache(cache);
            }

            if (naColecao) {
                const badge = document.createElement("span");
                badge.className = "myp-colecao-badge";
                badge.innerHTML = `<i class="fas fa-book-open"></i> Na coleção`;
                nameP.appendChild(badge);
            }
        } catch (err) {
            loading.textContent = "erro ao verificar";
            console.warn("[AwesoMYP] checkColecaoItem falhou:", anchor.href, err);
        }
    }

    // ── Repaginar────────────────────────────────────────────────────────────────

	function repaginate() {
		setCurrentAction();
		removeElements();
		adjustElements();
		setFocus();
		reorderFoilSelect();
		addFoilButton();
		reorderLanguageSelect();
		addLanguageButton();
		setFirstEdition();
        sortCarrinhoItens();
		collapseCarrinhoItens();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", repaginate);
	} else {
		repaginate();
	}
})();
