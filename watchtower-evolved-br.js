/*
 * WatchTower Evolved - versao independente (PT-BR)
 *
 * Baseado no script "WatchTower Evolved" de RedAlert (mod JawJaw), reescrito para:
 *   - NAO depender do twSDK.js nem do twscripts.dev (nenhum contador de uso, nada enviado para fora)
 *   - ler sozinho o nivel das suas torres (botao "Minhas torres")
 *   - nao quebrar quando rodado direto de um link (nao usa document.currentScript)
 *   - nao deixar o clique do mapa sequestrado o tempo todo (agora e um botao liga/desliga)
 *   - nao montar HTML com texto vindo de importacao (evita injecao de codigo)
 *
 * Dependencia externa unica: o MapSdk do Shinko to Kuma / Sass (mesmo do script original),
 * carregado de https://shinko-to-kuma.com/scripts/mapSdk.js
 *
 * Usa a mesma chave de armazenamento do original ("watchtowerEvolved_data"), entao a lista
 * que voce ja tinha salva continua aparecendo.
 *
 * Roda na tela do MAPA. Se estiver em outra tela, ele te leva para o mapa (clique de novo la).
 */
(function () {
  'use strict';

  // ------------------------- CONFIGURACAO -------------------------

  var CHAVE = 'watchtowerEvolved_data';
  var ID = 'wtEvolvedWidget';
  var TAG = 'wtEvolved';
  var SDK_URL = 'https://shinko-to-kuma.com/scripts/mapSdk.js';
  var COR_PADRAO = '#00bcd4';
  var OPACIDADE = 0.35;

  // Raio da torre por nivel (indice = nivel)
  var RAIOS = [0, 1.1, 1.3, 1.5, 1.7, 2, 2.3, 2.6, 3, 3.4, 3.9,
               4.4, 5.1, 5.8, 6.7, 7.6, 8.7, 10, 11.5, 13.1, 15];

  // ------------------------- ENTRADA -------------------------

  if (typeof game_data === 'undefined' || game_data.screen !== 'map' || typeof TWMap === 'undefined') {
    UI.InfoMessage('Indo para o mapa. Clique no script de novo la.', 2500);
    setTimeout(function () {
      location.href = game_data.link_base_pure + 'map';
    }, 800);
    return;
  }

  var cliqueAtivo = false;
  // guarda o handler original do jogo uma unica vez, mesmo se o script rodar duas vezes
  if (!window.__wtCliqueOriginal) window.__wtCliqueOriginal = TWMap.map._handleClick;

  function carregarSdk() {
    if (typeof MapSdk !== 'undefined' && MapSdk.circles) {
      return $.Deferred().resolve().promise();
    }
    return $.getScript(SDK_URL);
  }

  carregarSdk()
    .done(function () {
      try {
        iniciar();
      } catch (e) {
        console.error('[WatchTower] erro ao iniciar', e);
        UI.ErrorMessage('Erro ao iniciar o script (veja o console, F12).');
      }
    })
    .fail(function () {
      UI.ErrorMessage('Nao consegui carregar o MapSdk (shinko-to-kuma.com). Ele pode estar fora do ar ou bloqueado.');
    });

  // ------------------------- FUNCOES AUXILIARES -------------------------

  function hexParaRgb(hex) {
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
  }

  function coordValida(c) {
    return /^\d{1,3}\|\d{1,3}$/.test(c);
  }

  function normalizar(it) {
    if (!it || typeof it !== 'object') return null;
    var coord = String(it.coord == null ? '' : it.coord).trim();
    var nivel = String(it.wtLevel == null ? '' : it.wtLevel).trim();
    var cor = /^#[0-9a-f]{6}$/i.test(it.wtColor) ? it.wtColor : COR_PADRAO;
    return { coord: coord, wtLevel: nivel, wtColor: cor };
  }

  function carregarSalvos() {
    try {
      var d = localStorage.getItem(CHAVE);
      var arr = d ? JSON.parse(d) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(lerLinhas()));
    } catch (e) { /* sem armazenamento, segue sem salvar */ }
  }

  function copiar(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).catch(function () { copiarAntigo(texto); });
    }
    copiarAntigo(texto);
    return Promise.resolve();
  }

  function copiarAntigo(texto) {
    var ta = document.createElement('textarea');
    ta.value = texto;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignora */ }
    document.body.removeChild(ta);
  }

  // ------------------------- INTERFACE -------------------------

  function montarWidget() {
    $('#' + ID).remove();

    var html =
      '<div id="' + ID + '">' +
        '<style>' +
          '#' + ID + '{position:fixed;right:10px;bottom:10px;width:340px;z-index:13000;background:#f4e4bc;' +
            'border:2px solid #7d510f;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.4);font-size:12px;color:#000}' +
          '#' + ID + ' .wt-head{background:#c1a264;padding:4px 8px;display:flex;justify-content:space-between;align-items:center;font-weight:bold}' +
          '#' + ID + ' .wt-head a{margin-left:10px;cursor:pointer;color:#000;text-decoration:none}' +
          '#' + ID + ' .wt-lista{max-height:260px;overflow-y:auto;overflow-x:hidden;margin:6px}' +
          '#' + ID + ' table{width:100%;border-collapse:collapse}' +
          '#' + ID + ' th,#' + ID + ' td{padding:2px;text-align:center}' +
          '#' + ID + ' .wt-in{width:100%;box-sizing:border-box;text-align:center;padding:2px;font-size:12px}' +
          '#' + ID + ' .wt-cor{width:34px;height:24px;padding:0}' +
          '#' + ID + ' .wt-botoes{margin:6px;display:flex;flex-wrap:wrap;gap:4px}' +
          '#' + ID + ' .wt-importar{margin:6px;display:none}' +
          '#' + ID + ' .wt-importar textarea{width:100%;height:70px;box-sizing:border-box}' +
        '</style>' +
        '<div class="wt-head"><span>WatchTower Evolved</span>' +
          '<span><a class="wt-min" title="Minimizar">_</a><a class="wt-fechar" title="Fechar">x</a></span></div>' +
        '<div class="wt-corpo">' +
          '<div class="wt-lista"><table><thead><tr>' +
            '<th>Aldeia</th><th>Nível</th><th>Cor</th><th></th>' +
          '</tr></thead><tbody id="wtLinhas"></tbody></table></div>' +
          '<div class="wt-botoes">' +
            '<a class="btn wt-b-minhas">Minhas torres</a>' +
            '<a class="btn wt-b-add">Adicionar</a>' +
            '<a class="btn wt-b-exibir">Exibir</a>' +
            '<a class="btn wt-b-export">Exportar</a>' +
            '<a class="btn wt-b-import">Importar</a>' +
            '<a class="btn wt-b-limpar">Limpar</a>' +
            '<a class="btn wt-b-clique">Clique no mapa: desligado</a>' +
          '</div>' +
          '<div class="wt-importar"><textarea placeholder="Cole aqui o JSON exportado"></textarea>' +
            '<a class="btn wt-b-import-ok">Importar</a></div>' +
        '</div>' +
      '</div>';

    $('body').append(html);
  }

  function adicionarLinha(item) {
    var it = normalizar(item) || { coord: '', wtLevel: '', wtColor: COR_PADRAO };
    var tr = $('<tr>');
    var tdCoord = $('<td>').append($('<input type="text" class="wt-in wt-coord" placeholder="500|500">').val(it.coord));
    var tdNivel = $('<td style="width:46px">').append($('<input type="text" class="wt-in wt-nivel" placeholder="1-20">').val(it.wtLevel));
    var tdCor = $('<td style="width:40px">').append($('<input type="color" class="wt-cor">').val(it.wtColor));
    var tdDel = $('<td style="width:24px">').append($('<a class="wt-del" style="cursor:pointer" title="Remover">&#10005;</a>'));
    tr.append(tdCoord, tdNivel, tdCor, tdDel);
    $('#wtLinhas').append(tr);
  }

  function preencher(lista) {
    $('#wtLinhas').empty();
    lista.forEach(adicionarLinha);
  }

  function lerLinhas() {
    var lista = [];
    $('#wtLinhas tr').each(function () {
      lista.push({
        coord: String($(this).find('.wt-coord').val() || '').trim(),
        wtLevel: String($(this).find('.wt-nivel').val() || '').trim(),
        wtColor: $(this).find('.wt-cor').val()
      });
    });
    return lista;
  }

  // ------------------------- DESENHO NO MAPA -------------------------

  function desenhar() {
    var itens = lerLinhas();
    var invalidos = 0;
    var desenhadas = 0;

    MapSdk.circles = MapSdk.circles.filter(function (c) { return c.tag !== TAG; });

    itens.forEach(function (it) {
      var m = /^(\d{1,3})\|(\d{1,3})$/.exec(it.coord);
      var nivel = parseInt(it.wtLevel, 10);
      if (!m || !(nivel >= 1 && nivel <= 20)) { invalidos++; return; }

      var rgb = hexParaRgb(it.wtColor) || { r: 0, g: 188, b: 212 };
      var preenchimento = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + OPACIDADE + ')';

      MapSdk.circles.push({
        tag: TAG,
        x: parseInt(m[1], 10),
        y: parseInt(m[2], 10),
        radius: RAIOS[nivel],
        styling: {
          main: { strokeStyle: '#000000', lineWidth: 2, fillStyle: preenchimento },
          mini: { strokeStyle: '#000000', lineWidth: 2, fillStyle: preenchimento }
        },
        drawOnMini: true,
        drawOnMap: true,
        markCircleOrigin: true
      });
      desenhadas++;
    });

    MapSdk.mapOverlay.reload();
    salvar();

    if (invalidos) {
      UI.ErrorMessage(invalidos + ' linha(s) ignorada(s): confira a coordenada (500|500) e o nível (1 a 20).');
    } else if (desenhadas) {
      UI.SuccessMessage(desenhadas + ' torre(s) no mapa.');
    }
  }

  // ------------------------- LER TORRES DO JOGO -------------------------

  async function importarDoJogo() {
    try {
      var html = await $.get(game_data.link_base_pure + 'overview_villages&mode=buildings&group=0&page=-1');
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var achadas = [];

      doc.querySelectorAll('#villages tr').forEach(function (tr) {
        var cel = tr.querySelector('.upgrade_building.b_watchtower');
        var nome = tr.querySelector('.quickedit-label');
        if (!cel || !nome) return;
        var nivel = parseInt(cel.textContent.trim(), 10);
        var m = nome.textContent.match(/(\d+)\|(\d+)/g);
        if (!nivel || nivel < 1 || !m) return;
        achadas.push({ coord: m[m.length - 1], nivel: Math.min(nivel, 20) });
      });

      if (!achadas.length) {
        UI.ErrorMessage('Nenhuma torre encontrada nas suas aldeias. Você pode adicionar à mão.');
        return;
      }

      var atuais = lerLinhas();
      achadas.forEach(function (a) {
        var existente = atuais.filter(function (c) { return c.coord === a.coord; })[0];
        if (existente) {
          existente.wtLevel = String(a.nivel);
        } else {
          atuais.push({ coord: a.coord, wtLevel: String(a.nivel), wtColor: COR_PADRAO });
        }
      });

      preencher(atuais);
      desenhar();
    } catch (e) {
      console.error('[WatchTower] erro ao ler as torres', e);
      UI.ErrorMessage('Não consegui ler suas torres (veja o console, F12).');
    }
  }

  // ------------------------- CLIQUE NO MAPA -------------------------

  function alternarClique() {
    cliqueAtivo = !cliqueAtivo;

    if (cliqueAtivo) {
      TWMap.map._handleClick = function (e) {
        var pos = this.coordByEvent(e);
        var vila = TWMap.villages[pos[0] * 1000 + pos[1]];
        if (vila && vila.id) {
          var coord = pos[0] + '|' + pos[1];
          var existe = lerLinhas().some(function (l) { return l.coord === coord; });
          if (!existe) {
            adicionarLinha({ coord: coord, wtLevel: '', wtColor: COR_PADRAO });
            salvar();
          }
        }
        return false;
      };
    } else {
      TWMap.map._handleClick = window.__wtCliqueOriginal;
    }

    $('#' + ID + ' .wt-b-clique').text('Clique no mapa: ' + (cliqueAtivo ? 'ligado' : 'desligado'));
  }

  // ------------------------- BOTOES -------------------------

  function ligarBotoes() {
    var w = $('#' + ID);

    w.on('click', '.wt-b-minhas', function () { importarDoJogo(); });

    w.on('click', '.wt-b-add', function () { adicionarLinha(null); });

    w.on('click', '.wt-b-exibir', function () { desenhar(); });

    w.on('click', '.wt-del', function () {
      $(this).closest('tr').remove();
      desenhar();
    });

    w.on('click', '.wt-b-limpar', function () {
      $('#wtLinhas').empty();
      desenhar();
    });

    w.on('click', '.wt-b-clique', alternarClique);

    w.on('click', '.wt-b-export', function () {
      copiar(JSON.stringify(lerLinhas())).then(function () {
        UI.SuccessMessage('Lista copiada para a área de transferência.');
      });
    });

    w.on('click', '.wt-b-import', function () {
      w.find('.wt-importar').toggle();
    });

    w.on('click', '.wt-b-import-ok', function () {
      var texto = w.find('.wt-importar textarea').val();
      var dados;
      try {
        dados = JSON.parse(texto);
      } catch (e) {
        UI.ErrorMessage('JSON inválido.');
        return;
      }
      if (!Array.isArray(dados)) {
        UI.ErrorMessage('O JSON precisa ser uma lista.');
        return;
      }

      var atuais = lerLinhas();
      var novos = 0;
      dados.slice(0, 500).forEach(function (bruto) {
        var it = normalizar(bruto);
        if (!it || !coordValida(it.coord)) return;
        if (atuais.some(function (c) { return c.coord === it.coord; })) return;
        atuais.push(it);
        novos++;
      });

      if (!novos) {
        UI.ErrorMessage('Nenhuma aldeia nova para importar.');
        return;
      }
      preencher(atuais);
      w.find('.wt-importar').hide();
      w.find('.wt-importar textarea').val('');
      UI.SuccessMessage(novos + ' aldeia(s) importada(s). Clique em Exibir.');
    });

    w.on('click', '.wt-min', function () { w.find('.wt-corpo').toggle(); });

    w.on('click', '.wt-fechar', function () {
      TWMap.map._handleClick = window.__wtCliqueOriginal;
      cliqueAtivo = false;
      w.remove();
    });
  }

  // ------------------------- INICIO -------------------------

  function iniciar() {
    montarWidget();
    var salvos = carregarSalvos().map(normalizar).filter(Boolean);
    preencher(salvos);
    ligarBotoes();

    if (salvos.length) {
      desenhar();
    } else {
      importarDoJogo();
    }
  }
})();
