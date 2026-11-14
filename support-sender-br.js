/*
 * Painel de Apoio em Massa - por CASTELO.GUERREIRO
 *
 * Baseado no "Support Sender" de Costache Madalin (o original nao declara licenca; os creditos
 * foram mantidos no painel). O que esta versao faz:
 *   1. Escolha do GRUPO de aldeias (troca o grupo do proprio jogo quando a tabela mostra outro)
 *   2. Modo de envio: FRACIONADO (um pouco de cada aldeia) ou CONCENTRADO (poucas aldeias)
 *   3. Prioridade no concentrado: mais LONGE primeiro (completa com as mais perto),
 *      mais perto primeiro, ou maior estoque primeiro
 *   4. RESERVA por aldeia: em UNIDADES ou em %, escolhida tropa por tropa
 *   5. Atalhos 25% / 50% / 75% / Tudo, botao "max", meta de populacao
 *   6. Sem arquivo do Dropbox, sem contador externo
 *
 * O script SO PREENCHE os campos da pagina. Voce confere e clica no botao de enviar do proprio jogo.
 *
 * Barra de acesso rapido (heavyCav = populacao da cavalaria pesada):
 *   javascript:var heavyCav=4;$.getScript('https://cdn.jsdelivr.net/gh/USUARIO/REPO@main/support-sender-br.js');void 0;
 */
(function () {
  'use strict';

  var AUTOR = 'CASTELO.GUERREIRO';
  var BANNER = 'data:image/jpeg;base64,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';

  // ------------------------- ENTRADA -------------------------

  var heavyCav = Number(window.heavyCav) > 0 ? Number(window.heavyCav) : 4;

  if (!/screen=place/.test(location.href) || !/mode=call/.test(location.href)) {
    UI.InfoMessage('Indo para o apoio em massa da Praça de Reunião. Clique no script de novo lá.', 3000);
    setTimeout(function () {
      location.href = game_data.link_base_pure + 'place&mode=call';
    }, 800);
    return;
  }

  var irPara = (typeof window.__ssIrPara === 'function') ? window.__ssIrPara : function (u) { window.location.href = u; };

  var units = Array.from(game_data.units).filter(function (u) {
    return u !== 'snob' && u !== 'militia' && u !== 'knight';
  });
  // tropas defensivas que aparecem no painel (na ordem de exibicao)
  var COLUNAS = ['spear', 'sword', 'archer', 'heavy', 'spy'];
  var exibidas = COLUNAS.filter(function (u) { return units.indexOf(u) !== -1; });
  var comArqueiro = game_data.units.indexOf('archer') !== -1;

  var NOMES = { spear: 'Lanceiro', sword: 'Espadachim', archer: 'Arqueiro', heavy: 'Cav. pesada', spy: 'Explorador' };

  // ------------------------- ESTADO -------------------------

  var groupCoords = null;          // Set com as coordenadas do grupo escolhido (null = sem filtro)
  var lastTotals = {};             // ultimo total disponivel por unidade (exato, em tropas)
  var lastPop = 0;
  var CHAVE_CONFIG = game_data.world + 'support_sender_settings_br2';

  // ------------------------- UTIL -------------------------

  function fmt(n) { return Number(n || 0).toLocaleString('pt-BR'); }

  function aviso(msg, tipo) {
    var st = $('#ss_status');
    st.removeClass('ss-ok ss-err ss-info').addClass(tipo === 'ok' ? 'ss-ok' : tipo === 'erro' ? 'ss-err' : 'ss-info').text(msg);
    try {
      if (tipo === 'ok') UI.SuccessMessage(msg, 3500);
      else if (tipo === 'erro') UI.ErrorMessage(msg, 4500);
      else UI.InfoMessage(msg, 3000);
    } catch (e) { /* sem UI */ }
  }

  // ------------------------- ESTILO -------------------------

  function addCssStyle() {
    $('#ss_style').remove();
    var css = `
    #ss_panel{position:fixed;z-index:13000;width:720px;max-width:98vw;max-height:94vh;overflow-y:auto;
      background:linear-gradient(#10203c,#0a1424);border:2px solid #c9a227;border-radius:12px;
      box-shadow:0 8px 28px rgba(0,0,0,.6);color:#f3ead0;font-size:13px;line-height:1.35;text-align:left}
    #ss_panel *{box-sizing:border-box}
    #ss_panel .ss-head{display:flex;align-items:center;gap:14px;padding:10px 14px;cursor:move;
      background:linear-gradient(#1f3d73,#12274d);border-bottom:2px solid #c9a227;border-radius:10px 10px 0 0}
    #ss_panel .ss-banner{height:66px;width:auto;border:2px solid #c9a227;border-radius:6px;display:block}
    #ss_panel .ss-title{flex:1}
    #ss_panel .ss-t1{font-size:21px;font-weight:bold;letter-spacing:1.5px;color:#fff}
    #ss_panel .ss-t2{font-size:12px;color:#e7c75a;letter-spacing:1px;margin-top:2px}
    #ss_panel .ss-ctrl a{display:inline-block;width:30px;height:30px;line-height:28px;text-align:center;margin-left:6px;
      border:1px solid #c9a227;border-radius:6px;color:#f3ead0;cursor:pointer;font-size:16px;text-decoration:none;background:#0d1a33}
    #ss_panel .ss-ctrl a:hover{background:#c9a227;color:#1b1303}
    #ss_panel .ss-card{margin:10px 12px;padding:10px 12px;background:#142544;border:1px solid #2c4a82;border-radius:10px}
    #ss_panel .ss-card h3{margin:0 0 8px 0;font-size:13px;letter-spacing:.5px;color:#e7c75a;text-transform:uppercase;font-weight:bold}
    #ss_panel .ss-n{display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;border-radius:50%;
      background:#c9a227;color:#1b1303;margin-right:6px;font-size:12px}
    #ss_panel .ss-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    #ss_panel select{background:#0a1222;color:#fff;border:1px solid #3a5a9a;border-radius:6px;padding:6px;font-size:13px;min-width:260px;max-width:100%}
    #ss_panel input[type=number],#ss_panel input[type=datetime-local]{background:#0a1222;color:#fff;border:1px solid #3a5a9a;
      border-radius:6px;padding:5px 6px;font-size:13px;width:96px;text-align:center}
    #ss_panel input[type=datetime-local]{width:auto}
    #ss_panel input:focus,#ss_panel select:focus{outline:none;border-color:#e7c75a}
    #ss_panel .ss-badge{color:#9db0d3;font-size:12px}
    #ss_panel .ss-warn{margin-top:8px;padding:8px 10px;border:1px solid #e5a50a;background:#3a2c07;border-radius:8px;color:#ffd87a}
    #ss_panel .ss-btn{display:inline-block;margin-left:8px;padding:4px 10px;border-radius:6px;background:#c9a227;color:#1b1303;
      font-weight:bold;cursor:pointer;text-decoration:none}
    #ss_panel .ss-quick{margin-bottom:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
    #ss_panel .ss-quick span{color:#9db0d3;margin-right:4px}
    #ss_panel .ss-chip{padding:5px 12px;border:1px solid #c9a227;border-radius:999px;background:#0d1a33;color:#f3ead0;cursor:pointer;font-weight:bold;font-size:12px}
    #ss_panel .ss-chip:hover{background:#c9a227;color:#1b1303}
    #ss_panel table.ss-units{width:100%;border-collapse:collapse}
    #ss_panel table.ss-units th{color:#9db0d3;font-weight:normal;font-size:11px;text-transform:uppercase;padding:4px;text-align:center;border-bottom:1px solid #2c4a82}
    #ss_panel table.ss-units td{padding:5px 4px;text-align:center;border-bottom:1px solid #1f3560}
    #ss_panel table.ss-units td.ss-un{text-align:left;white-space:nowrap}
    #ss_panel table.ss-units td.ss-un img{vertical-align:middle;margin-right:6px}
    #ss_panel .ss-av{font-weight:bold;color:#fff}
    #ss_panel .ss-max{margin-left:6px;color:#e7c75a;cursor:pointer;font-size:11px;text-decoration:underline}
    #ss_panel input.ss-over{border-color:#e5534b;background:#3a1210}
    #ss_panel .ss-pop{margin-top:8px;display:flex;gap:14px;flex-wrap:wrap;align-items:center;color:#9db0d3}
    #ss_panel .ss-pop b{color:#fff}
    #ss_panel .ss-sub{margin-top:10px;color:#9db0d3}
    #ss_panel .ss-seg{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
    #ss_panel .ss-seg input{position:absolute;opacity:0;pointer-events:none}
    #ss_panel .ss-seg label{padding:7px 13px;border:1px solid #3a5a9a;border-radius:999px;background:#0d1a33;color:#f3ead0;cursor:pointer;font-size:12.5px}
    #ss_panel .ss-seg label small{display:block;font-size:10.5px;color:#9db0d3;margin-top:1px}
    #ss_panel .ss-seg input:checked + label{background:#c9a227;border-color:#e7c75a;color:#1b1303;font-weight:bold}
    #ss_panel .ss-seg input:checked + label small{color:#3b2c04}
    #ss_panel .ss-seg label:hover{border-color:#e7c75a}
    #ss_panel .ss-big label{padding:9px 16px}
    #ss_panel .ss-off{opacity:.38;pointer-events:none}
    #ss_panel details.ss-card summary{cursor:pointer;color:#e7c75a;font-weight:bold;text-transform:uppercase;font-size:12.5px}
    #ss_panel .ss-adv{margin-top:8px;display:flex;gap:14px;flex-wrap:wrap;align-items:center}
    #ss_panel .ss-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:12px 12px 6px 12px}
    #ss_panel .ss-primary{padding:13px 34px;border:1px solid #fff2b3;border-radius:10px;cursor:pointer;font-size:17px;font-weight:bold;letter-spacing:1px;
      color:#1b1303;background:linear-gradient(#f1d062,#c9a227);box-shadow:0 2px 8px rgba(0,0,0,.5)}
    #ss_panel .ss-primary:hover{background:linear-gradient(#ffe27f,#d9b232)}
    #ss_panel .ss-second{padding:10px 18px;border:1px solid #c9a227;border-radius:10px;cursor:pointer;color:#f3ead0;background:#0d1a33;font-weight:bold}
    #ss_panel .ss-second:hover{background:#1c315c}
    #ss_panel .ss-auto{color:#9db0d3;font-size:12px}
    #ss_panel .ss-status{margin:6px 12px 10px 12px;min-height:20px;font-weight:bold}
    #ss_panel .ss-ok{color:#5fd07a}
    #ss_panel .ss-err{color:#ff7b72}
    #ss_panel .ss-info{color:#9db0d3}
    #ss_panel .ss-foot{padding:7px 12px;text-align:center;font-size:11px;color:#9db0d3;border-top:1px solid #2c4a82;background:#0c1830;border-radius:0 0 10px 10px}
    #ss_panel .ss-foot b{color:#e7c75a;letter-spacing:.5px}
    @media (max-width:700px){#ss_panel{width:98vw}#ss_panel .ss-banner{height:48px}#ss_panel .ss-t1{font-size:16px}#ss_panel select{min-width:0;width:100%}}
    `;
    $('<style id="ss_style">').text(css).appendTo('head');
  }

  // ------------------------- INTERFACE -------------------------

  function createMainInterface() {
    var linhas = '';
    exibidas.forEach(function (u) {
      linhas += '<tr>' +
        '<td class="ss-un"><img src="https://dsen.innogamescdn.com/asset/1d2499b/graphic/unit/unit_' + u + '.png" alt="' + u + '">' + NOMES[u] + '</td>' +
        '<td><span class="ss-av" id="tot_' + u + '">0</span></td>' +
        '<td><input id="' + u + 'send" type="number" min="0" step="1" value="0" class="sendTroops"><a class="ss-max" data-u="' + u + '">máx</a></td>' +
        '<td class="ss-resv"><input id="' + u + 'Reserve" type="number" min="0" step="1" value="0" class="reserveTroops"> <span class="ss-suf">un</span></td>' +
        '</tr>';
    });

    var colsDatas = '';
    var html = `
    <div id="ss_panel">
      <div class="ss-head" id="ss_head">
        <img class="ss-banner" src="${BANNER}" alt="${AUTOR}">
        <div class="ss-title">
          <div class="ss-t1">APOIO EM MASSA</div>
          <div class="ss-t2">PAINEL ${AUTOR}</div>
        </div>
        <div class="ss-ctrl"><a id="ss_min" title="Recolher / abrir">&#8211;</a><a id="ss_close" title="Fechar">&#10005;</a></div>
      </div>

      <div id="ss_body">
        <section class="ss-card">
          <h3><span class="ss-n">1</span>De onde sai o apoio</h3>
          <div class="ss-row">
            <select id="group_select"><option value="0">Todas as aldeias da tabela do jogo</option></select>
            <span id="group_info" class="ss-badge"></span>
          </div>
          <div id="group_warn" class="ss-warn" style="display:none"></div>
        </section>

        <section class="ss-card">
          <h3><span class="ss-n">2</span>Quanto enviar e quanto deixar em casa</h3>
          <div class="ss-quick">
            <span>Atalhos:</span>
            <a class="ss-chip" data-pct="25">25%</a><a class="ss-chip" data-pct="50">50%</a>
            <a class="ss-chip" data-pct="75">75%</a><a class="ss-chip" data-pct="100">Tudo</a>
            <a class="ss-chip" data-pct="0">Zerar</a>
          </div>
          <table class="ss-units">
            <thead><tr><th style="text-align:left">Tropa</th><th>Disponível</th><th>Enviar</th><th>Reserva por aldeia <span class="ss-suf-h">(un)</span></th></tr></thead>
            <tbody>${linhas}</tbody>
          </table>
          <div class="ss-sub">Reserva (fica em casa em cada aldeia):</div>
          <div class="ss-seg" id="reserve_seg">
            <input type="radio" name="reserve_mode" id="rm_none" value="none" checked><label for="rm_none">Nenhuma</label>
            <input type="radio" name="reserve_mode" id="rm_units" value="units"><label for="rm_units">Em unidades</label>
            <input type="radio" name="reserve_mode" id="rm_pct" value="pct"><label for="rm_pct">Em %</label>
          </div>
          <div class="ss-pop">
            <span>População disponível: <b id="pop_total">0</b></span>
            <span>A enviar: <b id="pop_send">0</b></span>
            <span>Meta de população: <input id="packets_send" type="number" min="0" step="1" value="0"></span>
          </div>
        </section>

        <section class="ss-card">
          <h3><span class="ss-n">3</span>Como distribuir</h3>
          <div class="ss-seg ss-big" id="dist_seg">
            <input type="radio" name="dist_mode" id="dm_fractioned" value="fractioned" checked>
            <label for="dm_fractioned">Fracionado<small>um pouco de cada aldeia</small></label>
            <input type="radio" name="dist_mode" id="dm_concentrated" value="concentrated">
            <label for="dm_concentrated">Concentrado<small>poucas aldeias, fecha a meta rápido</small></label>
          </div>
          <div id="order_box" class="ss-off">
            <div class="ss-sub">Quem manda primeiro (modo concentrado):</div>
            <div class="ss-seg">
              <input type="radio" name="dist_order" id="do_far" value="far" checked><label for="do_far">Mais longe primeiro<small>completa com as mais perto</small></label>
              <input type="radio" name="dist_order" id="do_near" value="near"><label for="do_near">Mais perto primeiro<small>chega mais cedo</small></label>
              <input type="radio" name="dist_order" id="do_stock" value="stock"><label for="do_stock">Maior estoque<small>usa menos aldeias</small></label>
            </div>
          </div>
        </section>

        <details class="ss-card" id="adv_box">
          <summary>Avançado: horário de chegada</summary>
          <div class="ss-adv">
            <label><input type="checkbox" id="checkbox_window" value="land_specific"> chegar entre</label>
            <label>início <input type="datetime-local" id="start_window"></label>
            <label>fim <input type="datetime-local" id="stop_window"></label>
            <label>sigilo (%) <input type="number" id="flag_boost" min="0" max="100" placeholder="0" value="0"></label>
          </div>
        </details>

        <div class="ss-actions">
          <button type="button" class="ss-primary" id="btn_fill">PREENCHER</button>
          <button type="button" class="ss-second" id="btn_calc">Recalcular</button>
          <label class="ss-auto"><input type="checkbox" id="auto_min" checked> recolher o painel depois de preencher</label>
        </div>
        <div id="ss_status" class="ss-status"></div>
      </div>

      <div class="ss-foot" id="ss_foot">Painel por <b>${AUTOR}</b> &middot; cálculo baseado no Support Sender (Costache Madalin)</div>
    </div>`;

    $('#ss_panel').remove();
    var alvoDom = $('#contentContainer').eq(0).length ? $('#contentContainer').eq(0) : $('#mobileContent').eq(0);
    if (!alvoDom.length) alvoDom = $('body');
    alvoDom.prepend(html);

    var p = $('#ss_panel');
    p.css({ top: '60px', left: Math.max(10, Math.round(($(window).width() - 720) / 2)) + 'px' });
    if ($.fn.draggable) p.draggable({ handle: '#ss_head' });

    $('#ss_close').on('click', function () { $('#ss_panel').remove(); });
    $('#ss_min').on('click', function () { alternarPainel(); });

    restaurarConfig();
    atualizarSufixoReserva();
    atualizarOrdem();
  }

  function alternarPainel(forcarRecolher) {
    var aberto = $('#ss_body').is(':visible');
    var recolher = (forcarRecolher === true) ? true : aberto;
    $('#ss_body, #ss_foot').toggle(!recolher);
  }

  function atualizarOrdem() {
    $('#order_box').toggleClass('ss-off', $('input[name=dist_mode]:checked').val() !== 'concentrated');
  }

  function atualizarSufixoReserva() {
    var modo = $('input[name=reserve_mode]:checked').val() || 'none';
    $('.ss-resv').toggleClass('ss-off', modo === 'none');
    var suf = (modo === 'pct') ? '%' : 'un';
    $('.ss-suf, .ss-suf-h').text(modo === 'pct' ? '%' : 'un');
    $('.ss-suf-h').text('(' + suf + ')');
    $('.reserveTroops').attr('max', modo === 'pct' ? 100 : '');
  }

  // ---- configuracao salva (por id: adicionar campos nao embaralha o que ja foi salvo)

  function salvarConfig() {
    var cfg = {};
    $('#ss_panel input, #ss_panel select').each(function () {
      if (!this.id || this.disabled) return;
      cfg[this.id] = (this.type === 'checkbox' || this.type === 'radio') ? this.checked : this.value;
    });
    try { localStorage.setItem(CHAVE_CONFIG, JSON.stringify(cfg)); } catch (e) { /* ignora */ }
  }

  function lerConfigSalva() {
    try { return JSON.parse(localStorage.getItem(CHAVE_CONFIG) || 'null'); } catch (e) { return null; }
  }

  function restaurarConfig() {
    var cfg = lerConfigSalva();
    if (!cfg) return;
    $('#ss_panel input, #ss_panel select').each(function () {
      if (!this.id || this.disabled || !(this.id in cfg)) return;
      if (this.id === 'group_select') return;           // restaurado depois que os grupos carregam
      if (this.type === 'checkbox' || this.type === 'radio') this.checked = !!cfg[this.id];
      else this.value = cfg[this.id];
    });
  }

  // ------------------------- GRUPOS -------------------------

  function extrairCoords(texto) {
    var m = String(texto || '').match(/\d{1,3}\|\d{1,3}/g);
    return m ? m[m.length - 1] : null;
  }

  function coordsDaTabela() {
    var set = new Set();
    $('#village_troup_list tbody tr').each(function () {
      var m = this.children[0] && this.children[0].innerText.match(/\d+\|\d+/);
      if (m) set.add(m[0]);
    });
    return set;
  }

  // endereco do proprio jogo para mostrar o grupo escolhido
  function urlDoGrupoNoJogo(id) {
    var achada = null, qualquer = null;
    $('a[href*="group="]').each(function () {
      var m = (this.getAttribute('href') || '').match(/[?&]group=(\d+)/);
      if (!m || m[1] !== String(id)) return;
      if (/mode=call/.test(this.href)) { achada = this.href; return false; }
      if (!qualquer) qualquer = this.href;
    });
    if (achada || qualquer) return achada || qualquer;
    var u = location.href;
    if (/[?&]group=\d+/.test(u)) return u.replace(/([?&])group=\d+/, '$1group=' + id);
    return u + (u.indexOf('?') === -1 ? '?' : '&') + 'group=' + id;
  }

  function trocarGrupoNoJogo(id) {
    salvarConfig();
    aviso('Trocando o grupo do jogo... depois que a página recarregar, clique no script de novo.', 'info');
    setTimeout(function () { irPara(urlDoGrupoNoJogo(id)); }, 700);
  }

  function atualizarStatusGrupo() {
    var tabela = coordsDaTabela();
    var info = $('#group_info');
    var warn = $('#group_warn').hide().empty();
    if (!groupCoords) {
      info.text(tabela.size + ' aldeia(s) na tabela do jogo');
      return;
    }
    var comuns = 0;
    groupCoords.forEach(function (c) { if (tabela.has(c)) comuns++; });
    if (comuns === groupCoords.size) {
      info.text('✔ ' + comuns + ' aldeia(s) do grupo');
      return;
    }
    info.text(comuns + ' de ' + groupCoords.size + ' aldeias do grupo na tabela');
    var texto = comuns === 0
      ? 'A tabela do jogo está mostrando outro grupo, por isso não há tropas desse grupo para calcular.'
      : 'Só ' + comuns + ' de ' + groupCoords.size + ' aldeias deste grupo aparecem na tabela do jogo.';
    warn.append($('<span>').text(texto + ' '));
    warn.append($('<a class="ss-btn" id="btn_trocar_grupo">').text('Trocar grupo no jogo').on('click', function () {
      trocarGrupoNoJogo($('#group_select').val());
    }));
    warn.show();
  }

  async function carregarGrupos() {
    var select = $('#group_select');
    var vistos = {};
    function add(id, nome) {
      id = String(id);
      if (id === '0' || vistos[id]) return;
      vistos[id] = 1;
      select.append($('<option>').val(id).text(nome));
    }

    try {
      var texto = await $.ajax({ url: game_data.link_base_pure + 'groups&mode=overview&ajax=load_group_menu', dataType: 'text' });
      var json = JSON.parse(texto);
      ((json && json.result) || []).forEach(function (g) {
        if (!g || g.group_id == null || g.type === 'separator') return;
        add(g.group_id, g.name == null ? ('grupo ' + g.group_id) : String(g.name));
      });
    } catch (e) {
      console.warn('[ApoioEmMassa] lista de grupos pelo endpoint falhou', e);
    }

    if (select.find('option').length < 2) {
      // alternativa: os links do menu de grupos da propria pagina
      $('a[href*="group="]').each(function () {
        var m = (this.getAttribute('href') || '').match(/[?&]group=(\d+)/);
        if (!m) return;
        var nome = $(this).text().replace(/^[\s\[>]+|[\s\]<]+$/g, '').trim();
        add(m[1], nome || ('grupo ' + m[1]));
      });
    }

    if (select.find('option').length < 2) {
      $('#group_info').text('(não consegui listar os grupos)');
      return;
    }

    // restaura o grupo escolhido da ultima vez, se ainda existir
    var cfg = lerConfigSalva();
    var salvo = cfg && cfg.group_select;
    if (salvo && salvo !== '0' && select.find('option').filter(function () { return this.value === String(salvo); }).length) {
      select.val(String(salvo));
      var set = await carregarAldeiasDoGrupo(String(salvo));
      if (set) {
        groupCoords = set;
      } else {
        select.val('0');
        groupCoords = null;
      }
      countTotalTroops();
    }
  }

  // devolve um Set de coordenadas do grupo, ou null se nao conseguiu
  async function carregarAldeiasDoGrupo(id) {
    // 1) endpoint de grupos do jogo
    try {
      var texto = await $.ajax({
        url: game_data.link_base_pure + 'groups&ajax=load_villages_from_group',
        type: 'POST',
        data: { h: game_data.csrf, group_id: id },
        dataType: 'text'
      });
      var json = JSON.parse(texto);
      var doc = new DOMParser().parseFromString((json && json.html) || '', 'text/html');
      var set = new Set();
      doc.querySelectorAll('#group_table tr').forEach(function (tr) {
        var c = extrairCoords(tr.textContent);
        if (c) set.add(c);
      });
      if (set.size) return set;
    } catch (e) {
      console.warn('[ApoioEmMassa] load_villages_from_group falhou, tentando a visao de edificios', e);
    }

    // 2) alternativa: visao geral de edificios filtrada pelo grupo
    try {
      var html = await $.get(game_data.link_base_pure + 'overview_villages&mode=buildings&group=' + encodeURIComponent(id) + '&page=-1');
      var doc2 = new DOMParser().parseFromString(html, 'text/html');
      var set2 = new Set();
      doc2.querySelectorAll('#villages tr .quickedit-label').forEach(function (el) {
        var c = extrairCoords(el.textContent);
        if (c) set2.add(c);
      });
      if (set2.size) return set2;
    } catch (e) {
      console.error('[ApoioEmMassa] nao consegui ler as aldeias do grupo', e);
    }
    return null;
  }

  // ------------------------- CALCULOS -------------------------

  function getSpeedConstant() {
    var chave = game_data.world + 'speedWorld';
    if (localStorage.getItem(chave) !== null) {
      return JSON.parse(localStorage.getItem(chave));
    }
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open('GET', '/interface.php?func=get_config', false);
    xmlHttp.send(null);
    var htmlDoc = new DOMParser().parseFromString(xmlHttp.responseText, 'text/html');
    var obj = {
      worldSpeed: Number(htmlDoc.getElementsByTagName('speed')[0].innerHTML),
      unitSpeed: Number(htmlDoc.getElementsByTagName('unit_speed')[0].innerHTML)
    };
    localStorage.setItem(chave, JSON.stringify(obj));
    return obj;
  }

  function calcDistance(coord1, coord2) {
    var a = coord1.split('|'), b = coord2.split('|');
    var dx = parseInt(a[0], 10) - parseInt(b[0], 10);
    var dy = parseInt(a[1], 10) - parseInt(b[1], 10);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function horaDoServidor() {
    try {
      var hora = document.getElementById('serverTime').innerText;
      var d = document.getElementById('serverDate').innerText.split('/');
      var data = new Date(d[1] + '/' + d[0] + '/' + d[2] + ' ' + hora);
      if (!isNaN(data.getTime())) return data;
    } catch (e) { /* cai no fallback */ }
    return new Date();
  }

  function countTotalTroops() {
    var dateStart = new Date();
    var dateStop = new Date();
    dateStart.setFullYear(dateStart.getFullYear() - 1);
    dateStop.setFullYear(dateStop.getFullYear() + 1);

    var sigil = 0;
    var timeWindow = document.getElementById('checkbox_window').checked;
    if (timeWindow) {
      dateStart = new Date(document.getElementById('start_window').value);
      dateStop = new Date(document.getElementById('stop_window').value);
      sigil = parseInt(document.getElementById('flag_boost').value, 10);
      if (isNaN(dateStart.getTime())) aviso('A data de início da janela está em formato inválido.', 'erro');
      if (isNaN(dateStop.getTime())) aviso('A data de fim da janela está em formato inválido.', 'erro');
      sigil = Number.isNaN(sigil) ? 0 : sigil;
    }

    var mapVillages = new Map();

    var coordDestination;
    if (game_data.device === 'desktop') {
      var achou = $('.village-name').text().match(/\d+\|\d+/);
      coordDestination = achou ? achou[0] : null;
    } else {
      coordDestination = $('#inputx').val() + '|' + $('#inputy').val();
    }
    if (!coordDestination || !/^\d+\|\d+$/.test(coordDestination)) {
      aviso('Não encontrei a aldeia de destino na página.', 'erro');
      return mapVillages;
    }

    var speeds = getSpeedConstant();
    var k = 1000 / (speeds.worldSpeed * speeds.unitSpeed);
    var speedTroop = {
      snob: 2100 * k, ram: 1800 * k, catapult: 1800 * k, sword: 1320 * k,
      axe: 1080 * k, spear: 1080 * k, archer: 1080 * k,
      heavy: 660 * k, light: 600 * k, marcher: 600 * k, knight: 600 * k, spy: 540 * k
    };

    var modoReserva = $('input[name=reserve_mode]:checked').val() || 'none';
    var agora = horaDoServidor();

    Array.from($('#village_troup_list tbody tr')).forEach(function (row) {
      var m = row.children[0] && row.children[0].innerText.match(/\d+\|\d+/);
      if (!m) return;
      var coord = m[0];

      // filtro de grupo: aldeia fora do grupo nao participa
      if (groupCoords && !groupCoords.has(coord)) return;

      var distance = calcDistance(coord, coordDestination);
      var objTroops = { distance: distance };

      units.forEach(function (troopName) {
        var totalTroops = parseInt($(row).find("[data-unit='" + troopName + "']").text(), 10);
        if (Number.isNaN(totalTroops)) totalTroops = 0;

        // reserva por aldeia: em unidades OU em %, definida tropa por tropa
        var guardar = 0;
        if (modoReserva !== 'none' && COLUNAS.indexOf(troopName) !== -1) {
          var v = parseFloat($('#' + troopName + 'Reserve').val());
          if (!Number.isNaN(v) && v > 0) {
            guardar = (modoReserva === 'pct') ? Math.ceil(totalTroops * Math.min(v, 100) / 100) : Math.floor(v);
          }
        }
        totalTroops = Math.max(totalTroops - guardar, 0);

        var timeTroop = speedTroop[troopName] * distance;       // ms
        timeTroop = timeTroop / (1 + sigil / 100.0);
        var chegada = new Date(agora.getTime() + timeTroop);

        if (totalTroops > 0 && dateStart.getTime() < chegada.getTime() && chegada.getTime() < dateStop.getTime()) {
          objTroops[troopName + '_speed'] = troopName;
        }
        objTroops[troopName] = totalTroops;

        if (timeWindow === false) {
          delete objTroops.ram;
          delete objTroops.catapult;
          delete objTroops.ram_speed;
          delete objTroops.catapult_speed;
        }
      });

      mapVillages.set(coord, objTroops);
    });

    var objTroopsTotal = { spear: 0, sword: 0, archer: 0, spy: 0, heavy: 0 };

    mapVillages.forEach(function (obj) {
      if (obj.ram_speed != undefined || obj.catapult_speed != undefined || obj.sword_speed != undefined) {
        objTroopsTotal.spear += obj.spear;
        objTroopsTotal.sword += obj.sword;
        objTroopsTotal.spy += obj.spy;
        objTroopsTotal.heavy += obj.heavy;
        if (obj.archer != undefined) objTroopsTotal.archer += obj.archer;
      } else if (obj.spear_speed != undefined || obj.archer_speed != undefined) {
        objTroopsTotal.spear += obj.spear;
        objTroopsTotal.heavy += obj.heavy;
        objTroopsTotal.spy += obj.spy;
        if (obj.archer != undefined) objTroopsTotal.archer += obj.archer;
      } else if (obj.heavy_speed != undefined) {
        objTroopsTotal.heavy += obj.heavy;
        objTroopsTotal.spy += obj.spy;
      } else if (obj.spy_speed != undefined) {
        objTroopsTotal.spy += obj.spy;
      }
    });

    if (!comArqueiro) delete objTroopsTotal.archer;

    exibidas.forEach(function (u) { $('#tot_' + u).text(fmt(objTroopsTotal[u] || 0)); });

    lastPop = (objTroopsTotal.spear || 0) + (objTroopsTotal.sword || 0) + (objTroopsTotal.archer || 0) + (objTroopsTotal.heavy || 0) * heavyCav;
    $('#pop_total').text(fmt(lastPop));
    lastTotals = objTroopsTotal;

    atualizarResumo();
    return mapVillages;
  }

  // soma a populacao a enviar e marca em vermelho o que passa do disponivel
  function lerEnvio(u) {
    var v = parseFloat($('#' + u + 'send').val());
    return (Number.isNaN(v) || v < 0) ? 0 : Math.round(v);
  }

  function atualizarResumo() {
    var pop = 0;
    exibidas.forEach(function (u) {
      var v = lerEnvio(u);
      $('#' + u + 'send').toggleClass('ss-over', v > (lastTotals[u] || 0));
      if (u === 'heavy') pop += v * heavyCav;
      else if (u === 'spear' || u === 'sword' || u === 'archer') pop += v;
    });
    $('#pop_send').text(fmt(pop));
  }

  // ------------------------- DISTRIBUICAO -------------------------

  // Divide `alvo` unidades entre as aldeias.
  //   disp[i]  = quanto a aldeia i pode enviar
  //   dist[i]  = distancia da aldeia i ate o alvo
  //   modo     = 'fractioned' (um pouco de cada) | 'concentrated' (enche uma aldeia por vez)
  //   ordem    = 'far' | 'near' | 'stock' (prioridade das aldeias)
  // Retorna um array de inteiros, na mesma ordem, cuja soma e exatamente `alvo`
  // (ou tudo o que existir, se nao houver tropas suficientes).
  function distribuir(disp, alvo, modo, ordem, dist) {
    var n = disp.length;
    var aloc = [];
    for (var z = 0; z < n; z++) aloc.push(0);
    alvo = Math.round(alvo);
    if (!n || !(alvo > 0)) return aloc;

    var idx = [];
    for (var i = 0; i < n; i++) if (disp[i] > 0) idx.push(i);
    if (!idx.length) return aloc;

    var prioridade = idx.slice().sort(function (a, b) {
      if (ordem === 'far' && dist[a] !== dist[b]) return dist[b] - dist[a];
      if (ordem === 'near' && dist[a] !== dist[b]) return dist[a] - dist[b];
      if (disp[a] !== disp[b]) return disp[b] - disp[a];          // empate / ordem "stock"
      return dist[b] - dist[a];
    });

    var restante = alvo;

    if (modo === 'concentrated') {
      prioridade.forEach(function (v) {
        if (restante <= 0) return;
        var t = Math.min(disp[v], restante);
        aloc[v] = t;
        restante -= t;
      });
      return aloc;
    }

    // fracionado: divide igualmente; quem tem pouco manda tudo e o resto e redistribuido
    var asc = idx.slice().sort(function (a, b) { return disp[a] - disp[b]; });
    var faltam = asc.length;
    asc.forEach(function (v) {
      var parte = Math.floor(restante / faltam);
      var t = Math.min(disp[v], parte);
      aloc[v] = t;
      restante -= t;
      faltam--;
    });

    // sobras do arredondamento: 1 por vez, seguindo a prioridade
    var andou = true;
    while (restante > 0 && andou) {
      andou = false;
      for (var j = 0; j < prioridade.length && restante > 0; j++) {
        var v = prioridade[j];
        if (aloc[v] < disp[v]) { aloc[v]++; restante--; andou = true; }
      }
    }
    return aloc;
  }

  // ------------------------- PREENCHER -------------------------

  // como cada aldeia pode participar, conforme a tropa mais lenta que chega dentro da janela
  var CLASSES = [
    { flag: 'ram_speed',      speed: 'ram',      ram: 1, cat: 0, sword: true,  spear: true,  heavy: true,  spy: true,     archer: true  },
    { flag: 'catapult_speed', speed: 'catapult', ram: 0, cat: 1, sword: true,  spear: true,  heavy: true,  spy: true,     archer: true  },
    { flag: 'sword_speed',    speed: 'sword',    ram: 0, cat: 0, sword: true,  spear: true,  heavy: true,  spy: true,     archer: true  },
    { flag: 'spear_speed',    speed: 'spear',    ram: 0, cat: 0, sword: false, spear: true,  heavy: true,  spy: true,     archer: true  },
    { flag: 'archer_speed',   speed: 'archer',   ram: 0, cat: 0, sword: false, spear: true,  heavy: true,  spy: true,     archer: true  },
    { flag: 'heavy_speed',    speed: 'heavy',    ram: 0, cat: 0, sword: false, spear: false, heavy: true,  spy: 'always', archer: false },
    { flag: 'spy_speed',      speed: 'spy',      ram: 0, cat: 0, sword: false, spear: false, heavy: false, spy: true,     archer: false }
  ];

  async function fillInputs() {
    // confere o grupo na hora de preencher (se voce mexeu nos grupos no meio tempo)
    var grupoId = $('#group_select').val();
    if (grupoId !== '0') {
      var set = await carregarAldeiasDoGrupo(grupoId);
      if (!set) {
        aviso('Não consegui carregar o grupo. Nada foi preenchido.', 'erro');
        return;
      }
      groupCoords = set;
    }

    var mapVillages = countTotalTroops();
    if (!mapVillages.size) {
      atualizarStatusGrupo();
      aviso('Nenhuma aldeia disponível: confira o grupo e a tabela do jogo.', 'erro');
      return;
    }

    var modo = $('input[name=dist_mode]:checked').val() || 'fractioned';
    var ordem = $('input[name=dist_order]:checked').val() || 'far';
    var timeWindow = document.getElementById('checkbox_window').checked;

    var sendTotal = exibidas.map(function (u) { return { troopName: u, value: lerEnvio(u) }; });
    var sendTotalObj = {};
    sendTotal.forEach(function (e) { sendTotalObj[e.troopName] = e.value; });

    if (!sendTotal.some(function (e) { return e.value > 0; })) {
      aviso('Digite quantas tropas enviar (ou use os atalhos 25% / 50% / 75% / Tudo).', 'erro');
      return;
    }

    for (var s = 0; s < sendTotal.length; s++) {
      var un = sendTotal[s].troopName;
      var disponivel = lastTotals[un] || 0;
      if (sendTotal[s].value > disponivel) {
        aviso('Tropas insuficientes de ' + NOMES[un] + ': você pediu ' + fmt(sendTotal[s].value) + ' e há ' + fmt(disponivel) + ' disponíveis.', 'erro');
        return;
      }
    }

    // colunas de tropas marcadas no cabecalho da tabela do jogo
    var checkbox = document.getElementById('village_troup_list').children[0].children[0].getElementsByTagName('input');
    for (var c = 0; c < checkbox.length - 1; c++) {
      var idUnidade = checkbox[c].id.split('_')[1];
      checkbox[c].checked = ['spear', 'sword', 'archer', 'spy', 'heavy', 'ram', 'catapult'].indexOf(idUnidade) !== -1;
    }
    var todas = document.getElementById('place_call_select_all');
    if (todas && !todas.checked) todas.click();
    $('#village_troup_list').find('input[type=number]:visible').val(0);

    // disponibilidade de cada aldeia conforme a classe de velocidade
    var listTotalRange = [];
    mapVillages.forEach(function (obj, coord) {
      var cls = null;
      for (var k = 0; k < CLASSES.length; k++) {
        if (obj[CLASSES[k].flag] != undefined) { cls = CLASSES[k]; break; }
      }
      if (!cls) return;

      function cond(u, permitido) {
        if (!permitido) return 0;
        return (sendTotalObj[u] > 0) ? obj[u] : 0;
      }

      var t = { coord: coord, speedTroop: cls.speed };
      t.ram = cls.ram;
      t.catapult = cls.cat;
      t.sword = cond('sword', cls.sword);
      t.spear = cond('spear', cls.spear);
      t.heavy = cond('heavy', cls.heavy);
      t.spy = (cls.spy === 'always') ? obj.spy : cond('spy', cls.spy);
      if (obj.archer != undefined) t.archer = cond('archer', cls.archer);
      t.axe = 0;
      t.light = 0;
      if (obj.marcher != undefined) t.marcher = 0;
      listTotalRange.push(t);
    });

    if (!listTotalRange.length) {
      aviso('Nenhuma aldeia consegue enviar nessas condições.', 'erro');
      return;
    }

    // distribuicao
    var dist = listTotalRange.map(function (v) { return mapVillages.get(v.coord).distance; });
    sendTotal.forEach(function (elem) {
      var disp = listTotalRange.map(function (v) { return v[elem.troopName] || 0; });
      var aloc = distribuir(disp, elem.value, modo, ordem, dist);
      listTotalRange.forEach(function (v, i) { v[elem.troopName] = aloc[i]; });
    });

    var mapResult = new Map();
    listTotalRange.forEach(function (v) {
      var marcador = v.speedTroop;
      if (timeWindow && sendTotalObj[marcador] !== undefined && v[marcador] === 0) v[marcador] = 1;
      if (timeWindow === false) { v.ram = 0; v.catapult = 0; }
      mapResult.set(v.coord, v);
    });

    // escreve nos campos da pagina
    var usadas = 0;
    Array.from($('.overview_table .selected')).forEach(function (row) {
      var m = row.children[0].innerText.match(/\d+\|\d+/);
      if (!m || !mapResult.has(m[0])) return;
      var obj = mapResult.get(m[0]);
      var totalTroopCount = 0;
      Object.keys(obj).forEach(function (n) {
        if (n !== 'speedTroop' && n !== 'coord') totalTroopCount += obj[n];
      });
      if (totalTroopCount > 1) {
        usadas++;
        Object.keys(obj).forEach(function (n) {
          if (n !== 'speedTroop' && n !== 'coord') $(row).find('.call-unit-box-' + n).val(obj[n]);
        });
      }
    });

    var modoTexto = (modo === 'concentrated')
      ? 'concentrado, ' + ({ far: 'mais longe primeiro', near: 'mais perto primeiro', stock: 'maior estoque primeiro' }[ordem] || '')
      : 'fracionado';
    aviso('Preenchido em ' + usadas + ' aldeia(s) (' + modoTexto + '). Confira a tabela e envie pelo botão do jogo.', 'ok');
    if ($('#auto_min').is(':checked')) alternarPainel(true);
  }

  // ------------------------- EVENTOS -------------------------

  function addEvents() {
    // qualquer mudanca nos campos: recalcula e salva
    $('#ss_panel').on('input change', 'input, select', function () {
      if (this.id === 'packets_send') return;
      countTotalTroops();
      salvarConfig();
    });

    $('input[name=dist_mode]').on('change', atualizarOrdem);
    $('input[name=reserve_mode]').on('change', atualizarSufixoReserva);

    // atalhos 25 / 50 / 75 / tudo / zerar
    $('#ss_panel').on('click', '.ss-chip', function () {
      var pct = parseInt($(this).attr('data-pct'), 10);
      exibidas.forEach(function (u) {
        $('#' + u + 'send').val(Math.floor((lastTotals[u] || 0) * pct / 100));
      });
      atualizarResumo();
      salvarConfig();
    });

    // "max" por tropa
    $('#ss_panel').on('click', '.ss-max', function () {
      var u = $(this).attr('data-u');
      $('#' + u + 'send').val(lastTotals[u] || 0);
      atualizarResumo();
      salvarConfig();
    });

    // meta de populacao: reparte proporcionalmente entre as tropas (explorador fica de fora)
    $('#packets_send').on('input', function () {
      var meta = parseFloat($(this).val());
      if (!(lastPop > 0) || Number.isNaN(meta) || meta < 0) return;
      var ratio = Math.min(meta / lastPop, 1);
      exibidas.forEach(function (u) {
        $('#' + u + 'send').val(u === 'spy' ? 0 : Math.floor((lastTotals[u] || 0) * ratio));
      });
      atualizarResumo();
      salvarConfig();
    });

    $('#group_select').on('change', async function () {
      var sel = $(this);
      var id = String(sel.val());
      var set = await carregarAldeiasDoGrupo(id);

      if (!set) {
        groupCoords = null;
        if (id !== '0') {
          sel.val('0');
          aviso('Não consegui carregar as aldeias desse grupo. Usando as aldeias da tabela.', 'erro');
        }
        atualizarStatusGrupo();
        countTotalTroops();
        salvarConfig();
        return;
      }

      var tabela = coordsDaTabela();
      var comuns = 0;
      set.forEach(function (c) { if (tabela.has(c)) comuns++; });
      groupCoords = (id === '0') ? null : set;
      salvarConfig();

      if (comuns < set.size) {
        // a tabela do jogo nao tem as aldeias desse grupo: muda o grupo do proprio jogo
        atualizarStatusGrupo();
        trocarGrupoNoJogo(id);
        return;
      }
      atualizarStatusGrupo();
      countTotalTroops();
    });

    $('#btn_fill').on('click', function () {
      fillInputs().catch(function (e) {
        console.error('[ApoioEmMassa] erro ao preencher', e);
        aviso('Erro ao preencher (veja o console, F12).', 'erro');
      });
    });

    $('#btn_calc').on('click', function () {
      countTotalTroops();
      atualizarStatusGrupo();
      aviso('Disponibilidade recalculada.', 'info');
    });
  }

  // ------------------------- INICIO -------------------------

  async function main() {
    addCssStyle();
    createMainInterface();
    addEvents();
    countTotalTroops();
    atualizarStatusGrupo();
    await carregarGrupos();
    atualizarStatusGrupo();
  }

  main().catch(function (e) {
    console.error('[ApoioEmMassa] erro ao iniciar', e);
    try { UI.ErrorMessage('Erro ao iniciar o script (veja o console, F12).'); } catch (x) { /* sem UI */ }
  });
})();
