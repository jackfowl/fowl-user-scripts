// ==UserScript==
// @name         _AwesoMYP_
// @version      1.7.1
// @description  Remover a barra principal, setar foco sempre na pesquisa e reordenar as opções de raridade e idioma. Colapsar itens do carrinho com soma reativa de quantidades e total.
// @author       JackFowl
// @match        *://mypcards.com
// @match        *://mypcards.com/*
// @match        *://*.mypcards.com/*
// @icon         https://mypcards.com/android-icon-144x144.png// ==UserScript==
// @name         _AwesoMYP_
// @version      1.7.0
// @description  Remover a barra principal, setar foco sempre na pesquisa e reordenar as opções de raridade e idioma. Colapsar itens do carrinho com soma reativa de quantidades e total.
// @author       JackFowl
// @match        *://mypcards.com
// @match        *://mypcards.com/*
// @match        *://*.mypcards.com/*
// @icon         https://mypcards.com/android-icon-144x144.png
// ==/UserScript==
(function () {
    window.addEventListener('error', (e) => {
        if (e.message?.includes('ERR_BLOCKED')) {
            e.preventDefault();
        }
    }, true);

	const CardGame = Object.freeze({ NONE: 0, YGO: 1, PKM: 2 });
	const Actions = Object.freeze({ NONE: 0, CART: 1, ORDER: 2, WISH: 3, CREATE: 4, UPDATE: 5 });
	const IDs_TO_REMOVE = "#dataenvioestoque-link, #btn-salvar-incluir, #main-menu-desktop, #main-menu-mobile, #header-spacer, #estoque-card-search";
	const CLS_TO_REMOVE = ".myp-file-upload__dropzone, .estoque-create .autocomplete-icon, .estoque-update .autocomplete-icon, .header-internal, .navegacao-itens";
	const IDs_TO_REMOVE_USER = "#titulo-cards, #usuario-pastas-marcas";
	const CLS_TO_REMOVE_USER = ".usuario-titulo-com-estrelas";
	const YGO_FOIL_MAIN_OPTIONS = ["9", "11", "12", "13"]; // Comum, Rara, Super Rara, Ultra Rara
	const PKM_FOIL_MAIN_OPTIONS = ["1", "2", "3", "6"]; // Normal, Foil, Reverse Foil, Promo
	const LANGUAGE_MAIN_OPTIONS = ["1", "2"]; //Português, Inglês
	let tcg=CardGame.NONE;
	let action=Actions.NONE;

	const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    function wait(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
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
        injectCardStyles();
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
	function reorderFoilSelect() {
		if (action !== Actions.CREATE) return;
		const select = document.getElementById("estoque-idfoil");
		if (!select) return;

		const allOptions = Array.from(select.options);
		let available = Array.from(select.options).map(opt => opt.value);
		if (tcg === CardGame.YGO) {
			available = YGO_FOIL_MAIN_OPTIONS;
        }
		else if (tcg === CardGame.PKM) {
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
		if (action !== Actions.CREATE) return;
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
		if (action !== Actions.CREATE) return;
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
		if (action !== Actions.CREATE) return;
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

    function injectCardStyles() {
        if (document.getElementById("myp-card-styles")) return;

		const style = document.createElement("style");
		style.id = "myp-card-styles";
        style.textContent = `
  .estoque-create .content-box .form .grid .btn, .estoque-update .content-box .form .grid .btn {
    margin-top: 6px;
    min-width: unset;
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
`;
        document.head.appendChild(style);
    }

	function injectCarrinhoStyles() {
		if (document.getElementById("myp-carrinho-styles")) return;

		const style = document.createElement("style");
		style.id = "myp-carrinho-styles";
		style.textContent = `
		    .carrinho-da-loja { padding: 4px !important; }
		    .carrinho-item-container-fix { gap: 4px !important; }
		    .carrinho-item-card { gap: 4px !important; }
			.myp-carrinho-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				cursor: pointer;
				user-select: none;
				padding: 6px 4px;
				border-radius: 4px;
				transition: background 0.15s;
                border-color: #00949d;
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
			}
			.myp-carrinho-controls button:hover {
				background: #e8e8e8;
			}
		`;
		document.head.appendChild(style);
	}

	function collapseCarrinhoItens() {
		if (!hasCart()) return;

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
			primeiroGrupo.parentElement.parentElement.insertBefore(controls, primeiroGrupo.parentElement);
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
        .myp-collection-controls {
            display: flex;
			gap: 8px;
        }
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

    function addColecaoButton() {
        let controlsEl;
        if (hasCart()) {
            controlsEl = document.getElementById("myp-carrinho-controls")
        } else if (action === Actions.WISH) {
            controlsEl = document.querySelector("ul.pagination li.first");
        }
        if (!controlsEl) return;
        injectColecaoStyles();
        let controls = document.getElementById("myp-collection-controls");
        if (!controls) {
            controls = document.createElement("div");
            controls.id = "myp-collection-controls";
            controls.className = "myp-collection-controls";
        }

        const btn = document.createElement("button");
        btn.id = "myp-btn-colecao";
        btn.textContent = "🔍 Verificar coleção";
        btn.onclick = async () => {
            btn.disabled = true;
            let itens = [];
            if (action === Actions.CART || action === Actions.ORDER) {
                itens = Array.from(document.querySelectorAll(".carrinho-item-card"));
            } else {
                itens = Array.from(document.querySelectorAll("div.card-btns a.btn-small"));
            }
            const total = itens.length;

            if (total === 0) {
                btn.textContent = "Nada a Verificar";
                return;
            }
			let time = 100;
            let done = 0;
            for (const item of itens) {
                const t = randomInt(250, 750);
                btn.textContent = `🔍 Verificando... (${done}/${total})`;
                const r = await checkColecaoItem(item);
                await wait(10);
                if (r.failed) {
                    time += t;
                	console.log( `🔍 Aguardando... ${time}ms`);
                    await wait(time);
                    time -= Math.floor(t / randomInt(1, 3));
                }
                done++;
            }

            btn.textContent = "✔ Coleção verificada";
            setTimeout(() => { btn.textContent = "🔍 Verificar coleção"; }, 2000);
            btn.disabled = false;
        };

        const btnLimpar = document.createElement("button");
        btnLimpar.textContent = "🗑 Limpar cache";
        btnLimpar.onclick = () => {
            localStorage.removeItem(COLECAO_KEY);
            btnLimpar.textContent = "✔ Cache limpo";
            setTimeout(() => { btnLimpar.textContent = "🗑 Limpar cache"; }, 2000);
        };

        controls.appendChild(btn);
        controls.appendChild(btnLimpar);
        controlsEl.appendChild(controls);
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
        const anchor = itemEl.querySelector(".carrinho-item-name a");
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

    async function checkColecaoItem(itemEl) {
        let naColecao = {qtde: 0, multiplas: false, failed: false};
        const anchor = itemEl.querySelector(".carrinho-item-name a");
        if (!anchor) return;

        const key = getColecaoItemKey(itemEl);
        const nameEl = itemEl.querySelector(".carrinho-item-name");
        if (!nameEl) return;
        const nameP = nameEl.querySelector("p");
        const cache = loadColecaoCache();

        const loading = document.createElement("span");
        loading.className = "myp-colecao-loading";
        loading.textContent = "verificando...";
        nameP.appendChild(loading);

        if (key && key in cache && cache[key]) {
            naColecao = cache[key];
        } else {
            try {
                let time = 100;
                for (let mainTries = 1; mainTries <= 3; mainTries++){
                    const mainT = randomInt(500, 1250);
                    try {
                        const doc = await getDoc(anchor.href);
                        naColecao.qtde = getQuantidadeItem(doc);
                        const outros = doc.querySelectorAll("i.fas.fa-book-open.fa-1x");
                        if (outros.length > 0) {
                            await wait(time);
                            naColecao.multiplas = true;
                            const outroT = randomInt(100, 1000);
                            for (const i of outros){
                                for (let internalTries = 0; internalTries <= 3;internalTries++){
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
                naColecao.failed = true;
                loading.textContent = "erro ao verificar";
                console.warn("[AwesoMYP] checkColecaoItem falhou:", anchor.textContent);
            }
        }

        if (!naColecao.failed) {
        	loading.remove();
        }

        if (naColecao.qtde > 0) {
            const badge = document.createElement("span");
            badge.className = "myp-colecao-badge";
            badge.innerHTML = `<i class="fas fa-book-open"></i> ${naColecao.qtde}${naColecao.multiplas ? "*" : ""}`;
            nameP.appendChild(badge);
        }
        return naColecao;
    }

    // ── Repaginar────────────────────────────────────────────────────────────────

	function repaginate() {
		setCurrentFlow();
		removeElements();
		adjustElements();
		setFocus();
		reorderFoilSelect();
		addFoilButton();
		reorderLanguageSelect();
		addLanguageButton();
		setFirstEdition();
		setOnSale();
        sortCarrinhoItens();
		collapseCarrinhoItens();
        addColecaoButton();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", repaginate);
	} else {
		repaginate();
	}
})();
// ==/UserScript==

(function () {
	const CardGame = Object.freeze({ NONE: 0, YGO: 1, PKM: 2 });
	const Actions = Object.freeze({ NONE: 0, CART: 1, ORDER: 2, WISH: 3, CREATE: 4, UPDATE: 5 });
	const IDs_TO_REMOVE = "#dataenvioestoque-link, #btn-salvar-incluir, #main-menu-desktop, #main-menu-mobile, #header-spacer, #estoque-card-search";
	const CLS_TO_REMOVE = ".myp-file-upload__dropzone, .estoque-create .autocomplete-icon, .estoque-update .autocomplete-icon, .header-internal, .navegacao-itens";
	const IDs_TO_REMOVE_USER = "#titulo-cards, #usuario-pastas-marcas";
	const CLS_TO_REMOVE_USER = ".usuario-titulo-com-estrelas";
	const YGO_FOIL_MAIN_OPTIONS = ["9", "11", "12", "13"]; // Comum, Rara, Super Rara, Ultra Rara
	const PKM_FOIL_MAIN_OPTIONS = ["1", "2", "3", "6"]; // Normal, Foil, Reverse Foil, Promo
	const LANGUAGE_MAIN_OPTIONS = ["1", "2"]; //Português, Inglês
	let tcg=CardGame.NONE;
	let action=Actions.NONE;

	function wait(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
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
        injectCardStyles();
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
	function reorderFoilSelect() {
		if (action !== Actions.CREATE) return;
		const select = document.getElementById("estoque-idfoil");
		if (!select) return;

		const allOptions = Array.from(select.options);
		let available = Array.from(select.options).map(opt => opt.value);
		if (tcg === CardGame.YGO) {
			available = YGO_FOIL_MAIN_OPTIONS;
        }
		else if (tcg === CardGame.PKM) {
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
		if (action !== Actions.CREATE) return;
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
		if (action !== Actions.CREATE) return;
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
		if (action !== Actions.CREATE) return;
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

    function injectCardStyles() {
        if (document.getElementById("myp-card-styles")) return;

		const style = document.createElement("style");
		style.id = "myp-card-styles";
        style.textContent = `
  .estoque-create .content-box .form .grid .btn, .estoque-update .content-box .form .grid .btn {
    margin-top: 6px;
    min-width: unset;
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
`;
        document.head.appendChild(style);
        console.log(style);
    }

	function injectCarrinhoStyles() {
		if (document.getElementById("myp-carrinho-styles")) return;

		const style = document.createElement("style");
		style.id = "myp-carrinho-styles";
		style.textContent = `
		    .carrinho-da-loja { padding: 4px !important; }
		    .carrinho-item-container-fix { gap: 4px !important; }
		    .carrinho-item-card { gap: 4px !important; }
			.myp-carrinho-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				cursor: pointer;
				user-select: none;
				padding: 6px 4px;
				border-radius: 4px;
				transition: background 0.15s;
                border-color: #00949d;
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
			}
			.myp-carrinho-controls button:hover {
				background: #e8e8e8;
			}
		`;
		document.head.appendChild(style);
	}

	function collapseCarrinhoItens() {
		if (!hasCart()) return;

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
			primeiroGrupo.parentElement.parentElement.insertBefore(controls, primeiroGrupo.parentElement);
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
        .myp-collection-controls {
            display: flex;
			gap: 8px;
        }
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

    function addColecaoButton() {
        let controlsEl;
        if (hasCart()) {
            controlsEl = document.getElementById("myp-carrinho-controls")
        } else if (action === Actions.WISH) {
            controlsEl = document.querySelector("ul.pagination li.first");
        }
        if (!controlsEl) return;
        injectColecaoStyles();
        let controls = document.getElementById("myp-collection-controls");
        if (!controls) {
            controls = document.createElement("div");
            controls.id = "myp-collection-controls";
            controls.className = "myp-collection-controls";
        }

        const btn = document.createElement("button");
        btn.id = "myp-btn-colecao";
        btn.textContent = "🔍 Verificar coleção";
        btn.onclick = async () => {
            btn.disabled = true;
            let itens = [];
            if (action === Actions.CART || action === Actions.ORDER) {
                itens = Array.from(document.querySelectorAll(".carrinho-item-card"));
            } else {
                itens = Array.from(document.querySelectorAll("div.card-btns a.btn-small"));
            }
            const total = itens.length;

            if (total === 0) {
                btn.textContent = "Nada a Verificar";
                return;
            }
			let time = 10;
            let done = 0;
            for (const item of itens) {
                btn.textContent = `🔍 Verificando... (${done}/${total})`;
                const r = await checkColecaoItem(item, time);
                if (r.failed) {
                	time += 150;
                	console.log( `🔍 Aguardando... ${time}ms`);
                }
                time -+ 50;
                await wait(time);
                done++;
            }

            btn.textContent = "✔ Coleção verificada";
        };

        const btnLimpar = document.createElement("button");
        btnLimpar.textContent = "🗑 Limpar cache";
        btnLimpar.onclick = () => {
            localStorage.removeItem(COLECAO_KEY);
            btnLimpar.textContent = "✔ Cache limpo";
            setTimeout(() => { btnLimpar.textContent = "🗑 Limpar cache"; }, 2000);
        };

        controls.appendChild(btn);
        controls.appendChild(btnLimpar);
        controlsEl.appendChild(controls);
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
        const anchor = itemEl.querySelector(".carrinho-item-name a");
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

    async function checkColecaoItem(itemEl, time) {
        let naColecao = {qtde: 0, multiplas: false, failed: false};
        const anchor = itemEl.querySelector(".carrinho-item-name a");
        if (!anchor) return;

        const key = getColecaoItemKey(itemEl);
        const nameEl = itemEl.querySelector(".carrinho-item-name");
        if (!nameEl) return;
        const nameP = nameEl.querySelector("p");
        const cache = loadColecaoCache();
		
        const loading = document.createElement("span");
        loading.className = "myp-colecao-loading";
        loading.textContent = "verificando...";
        nameP.appendChild(loading);

        if (key && key in cache && cache[key]) {
            naColecao = cache[key];
        } else {
            try {
                const doc = await getDoc(anchor.href);
                naColecao.qtde = getQuantidadeItem(doc);
                const outros = doc.querySelectorAll("i.fas.fa-book-open.fa-1x");
                if (outros.length > 0) {
                    naColecao.multiplas = true;
                    for (const i of outros){
                        await wait(time);
                        const subDoc = await getDoc(i.parentElement.href);
                        naColecao.qtde += getQuantidadeItem(subDoc);
                    }
                }
                if (key) {
                    cache[key] = naColecao;
                    saveColecaoCache(cache);
                }
            } catch (err) {
                naColecao.total = 0;
                naColecao.failed = true;
                loading.textContent = "erro ao verificar";
                console.warn("[AwesoMYP] checkColecaoItem falhou:", anchor.textContent);
            }
        }
        
        if (!naColecao.failed) {
        	loading.remove();
        }
        
        if (naColecao.qtde > 0) {
            const badge = document.createElement("span");
            badge.className = "myp-colecao-badge";
            badge.innerHTML = `<i class="fas fa-book-open"></i> ${naColecao.qtde}${naColecao.multiplas ? "*" : ""}`;
            nameP.appendChild(badge);
        }
        return naColecao;
    }

    // ── Repaginar────────────────────────────────────────────────────────────────

	function repaginate() {
		setCurrentFlow();
		removeElements();
		adjustElements();
		setFocus();
		reorderFoilSelect();
		addFoilButton();
		reorderLanguageSelect();
		addLanguageButton();
		setFirstEdition();
		setOnSale();
        sortCarrinhoItens();
		collapseCarrinhoItens();
        addColecaoButton();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", repaginate);
	} else {
		repaginate();
	}
})();
