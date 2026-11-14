/*
 * Support Sender - versao PT-BR com grupos, modos de envio e reserva
 *
 * Baseado no "Support Sender" de Costache Madalin (o original nao declara licenca; os creditos
 * foram mantidos). Alteracoes desta versao:
 *   - Escolha do GRUPO de aldeias que vao enviar apoio
 *   - Modo de envio: FRACIONADO (um pouco de cada aldeia) ou CONCENTRADO (preenche a meta com
 *     o menor numero possivel de aldeias)
 *   - Prioridade no modo concentrado: mais LONGE primeiro (e completa com as mais perto),
 *     mais perto primeiro, ou maior estoque primeiro
 *   - RESERVA por aldeia: em unidades por tipo de tropa e/ou em % do estoque
 *   - Nao carrega arquivo do Dropbox (o CSS esta embutido) e nao usa contador externo
 *   - O valor de heavyCav do link da barra agora e respeitado
 *   - Pode ser executado mais de uma vez na mesma pagina sem erro
 *
 * O script SO PREENCHE os campos da pagina. Voce confere e clica no botao de enviar do proprio jogo.
 *
 * Uso na barra de acesso rapido (heavyCav = populacao da cavalaria pesada):
 *   javascript:var heavyCav=4;$.getScript('https://cdn.jsdelivr.net/gh/USUARIO/REPO@main/support-sender-br.js');void 0;
 */
(function () {
  'use strict';

  // ------------------------- ENTRADA -------------------------

  var heavyCav = Number(window.heavyCav) > 0 ? Number(window.heavyCav) : 4;

  if (!/screen=place/.test(location.href) || !/mode=call/.test(location.href)) {
    UI.InfoMessage('Indo para o apoio em massa da Praça de Reunião. Clique no script de novo lá.', 3000);
    setTimeout(function () {
      location.href = game_data.link_base_pure + 'place&mode=call';
    }, 800);
    return;
  }

  var units = Array.from(game_data.units).filter(function (u) {
    return u !== 'snob' && u !== 'militia' && u !== 'knight';
  });
  var COLUNAS = ['spear', 'sword', 'archer', 'spy', 'heavy'];         // unidades que aparecem na interface
  var exibidas = units.filter(function (u) { return COLUNAS.indexOf(u) !== -1; });
  var comArqueiro = game_data.units.indexOf('archer') !== -1;

  var NOMES = { spear: 'lanceiro', sword: 'espadachim', archer: 'arqueiro', spy: 'explorador', heavy: 'cav. pesada' };

  // ------------------------- ESTADO -------------------------

  var groupCoords = null;          // Set com as coordenadas do grupo escolhido (null = todas as aldeias)
  var lastTotals = {};             // ultimo total disponivel por unidade (exato, em tropas)
  var CHAVE_CONFIG = game_data.world + 'support_sender_settings_br';

  // ------------------------- TEMA -------------------------

  var defaultTheme = '[["theme1",["#E0E0E0","#000000","#C5979D","#2B193D","#2C365E","#484D6D","#4B8F8C","50"]],["currentTheme","theme1"],["theme2",["#E0E0E0","#000000","#F76F8E","#113537","#37505C","#445552","#294D4A","50"]],["theme3",["#E0E0E0","#000000","#ACFCD9","#190933","#665687","#7C77B9","#623B5A","50"]],["theme4",["#E0E0E0","#000000","#181F1C","#60712F","#274029","#315C2B","#214F4B","50"]],["theme5",["#E0E0E0","#000000","#9AD1D4","#007EA7","#003249","#1F5673","#1C448E","50"]],["theme6",["#E0E0E0","#000000","#EA8C55","#81171B","#540804","#710627","#9E1946","50"]],["theme7",["#E0E0E0","#000000","#754043","#37423D","#171614","#3A2618","#523A34","50"]],["theme8",["#E0E0E0","#000000","#9E0031","#8E0045","#44001A","#600047","#770058","50"]],["theme9",["#E0E0E0","#000000","#C1BDB3","#5F5B6B","#323031","#3D3B3C","#575366","50"]],["theme10",["#E0E0E0","#000000","#E6BCCD","#29274C","#012A36","#14453D","#7E52A0","50"]]]';
  var localStorageThemeName = 'supportSenderTheme';

  var textColor = '#ffffff';
  var backgroundInput = '#000000';
  var borderColor = '#C5979D';
  var backgroundContainer = '#2B193D';
  var backgroundHeader = '#2C365E';
  var backgroundMainTable = '#484D6D';
  var backgroundInnerTable = '#4B8F8C';
  var widthInterface = 50;
  var headerColorDarken = -50;
  var headerColorAlternateTable = -30;
  var headerColorAlternateHover = 30;

  function getColorDarker(hexInput, percent) {
    var hex = hexInput.replace(/^\s*#|\s*$/g, '');
    if (hex.length === 3) hex = hex.replace(/(.)/g, '$1$1');
    var r = parseInt(hex.substr(0, 2), 16);
    var g = parseInt(hex.substr(2, 2), 16);
    var b = parseInt(hex.substr(4, 2), 16);
    var p = (100 + percent) / 100;
    r = Math.round(Math.min(255, Math.max(0, r * p)));
    g = Math.round(Math.min(255, Math.max(0, g * p)));
    b = Math.round(Math.min(255, Math.max(0, b * p)));
    return '#' + ('00' + r.toString(16)).slice(-2).toUpperCase() + ('00' + g.toString(16)).slice(-2).toUpperCase() + ('00' + b.toString(16)).slice(-2).toUpperCase();
  }

  function invertColor(hex) {
    if (hex.indexOf('#') === 0) hex = hex.slice(1);
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    if (hex.length !== 6) return '#ffffff';
    function h(n) { return ('00' + (255 - parseInt(n, 16)).toString(16)).slice(-2); }
    return '#' + h(hex.slice(0, 2)) + h(hex.slice(2, 4)) + h(hex.slice(4, 6));
  }

  function initializationTheme() {
    try {
      if (localStorage.getItem(localStorageThemeName) != null) {
        // migracao de temas antigos (7 cores -> 8)
        var antigo = new Map(JSON.parse(localStorage.getItem(localStorageThemeName)));
        antigo.forEach(function (lista, key) {
          if (key !== 'currentTheme' && lista.length === 7) { lista.push(50); antigo.set(key, lista); }
        });
        localStorage.setItem(localStorageThemeName, JSON.stringify(Array.from(antigo.entries())));
      } else {
        localStorage.setItem(localStorageThemeName, defaultTheme);
      }

      var mapTheme = new Map(JSON.parse(localStorage.getItem(localStorageThemeName)));
      var colours = mapTheme.get(mapTheme.get('currentTheme'));
      if (!colours) throw new Error('tema invalido');

      textColor = colours[0];
      backgroundInput = colours[1];
      borderColor = colours[2];
      backgroundContainer = colours[3];
      backgroundHeader = colours[4];
      backgroundMainTable = colours[5];
      backgroundInnerTable = colours[6];
      widthInterface = (game_data.device !== 'desktop') ? 98 : colours[7];
    } catch (e) {
      localStorage.setItem(localStorageThemeName, defaultTheme);
    }
  }

  function addCssStyle() {
    $('#ss_style').remove();
    var css = `
    .scriptContainer{
        width: ${widthInterface}%;
        background: ${backgroundContainer};
        cursor: move;
        z-index: 50;
        border-radius: 15px;
        border-style: solid;
        border-width: 5px;
        border-color: ${backgroundHeader};
        max-height: 92vh;
        overflow-y: auto;
    }
    .scriptHeader{
        color: ${textColor};
        background: ${backgroundHeader};
        width: 100%;
        margin: 0 auto;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .scriptFooter{
        color: ${textColor};
        background: ${backgroundHeader};
        width: 100%;
        margin: 0 auto;
        display: flex;
        justify-content: right;
        align-items: center;
    }
    .scriptTable{
        position: relative;
        width: 95%;
        border-collapse: collapse;
        table-layout: fixed;
        margin: 20px auto;
    }
    .scriptTable td{
        width: auto;
        overflow: hidden;
        text-overflow: ellipsis;
        border: 1px solid ${borderColor};
        padding: 10px;
        text-align: center;
        color: ${textColor};
        word-wrap: break-word;
    }
    .scriptTable tr:nth-child(odd){ background: ${getColorDarker(backgroundMainTable, headerColorAlternateTable)}; }
    .scriptTable tr:nth-child(even){ background: ${backgroundMainTable}; }
    .scriptTable tr:first-child{
        border: 1px solid ${borderColor};
        color: ${textColor};
        background: ${getColorDarker(backgroundMainTable, headerColorDarken)};
    }
    .scriptTable tr:not(:first-child):hover{ background-color: ${getColorDarker(backgroundMainTable, headerColorAlternateHover)}; }
    .scriptContainer .scriptInput{
        width: 50%;
        font-size: 15px;
        background-color: ${backgroundInput};
        border-radius: 10px;
        color: ${textColor};
        text-align: center;
    }
    .scriptContainer input[type="text"]:disabled{
        background: ${getColorDarker(invertColor(textColor), 50)};
        text-align: center;
    }
    .scriptContainer select{
        background: ${backgroundInput};
        color: ${textColor};
        border-radius: 5px;
        max-width: 95%;
        font-size: 14px;
    }
    .scriptContainer select:disabled{ opacity: .5; }
    `;
    $('<style id="ss_style">').text(css).appendTo('head');
  }

  // ------------------------- INTERFACE -------------------------

  function createMainInterface() {
    var cols = 2 + exibidas.length;
    var c1 = Math.floor((cols - 1) / 2);
    var c2 = cols - 1 - c1;
    var colsDatas = comArqueiro ? 4 : 3;

    var html = `
    <div id="div_container" class="scriptContainer">
        <div class="scriptHeader">
            <div style="margin-top:10px;"><h2>Apoio em massa</h2></div>
            <div style="position:absolute;top:10px;right:10px;"><a href="javascript:void(0)" id="div_close"><img src="https://img.icons8.com/emoji/24/000000/cross-mark-button-emoji.png" alt="fechar"/></a></div>
            <div style="position:absolute;top:8px;right:35px;" id="div_minimize"><a href="javascript:void(0)"><img src="https://img.icons8.com/plasticine/28/000000/minimize-window.png" alt="minimizar"/></a></div>
            <div style="position:absolute;top:10px;right:60px;" id="div_theme"><a href="javascript:void(0)" id="div_theme_link"><img src="https://img.icons8.com/material-sharp/24/fa314a/change-theme.png" alt="tema"/></a></div>
        </div>

        <div id="theme_settings"></div>

        <div id="div_body">
            <table id="table_upload" class="scriptTable">
                <tr>
                    <td>tropas</td>`;

    exibidas.forEach(function (u) {
      html += `<td class="fm_unit"><img src="https://dsen.innogamescdn.com/asset/1d2499b/graphic/unit/unit_${u}.png" alt="${u}" title="${NOMES[u] || u}"></td>`;
    });

    html += `
                    <td>pop</td>
                </tr>
                <tr id="totalTroops">
                    <td>disponível (mil)</td>`;
    exibidas.forEach(function (u) {
      html += `<td><input id="${u}total" value="0" type="text" class="totalTroops scriptInput" disabled></td>`;
    });
    html += `
                    <td><input id="packets_total" value="0" type="text" class="scriptInput" disabled></td>
                </tr>
                <tr id="sendTroops">
                    <td>enviar (mil)</td>`;
    exibidas.forEach(function (u) {
      html += `<td align="center"><input id="${u}send" value="0" type="number" step="any" min="0" class="scriptInput sendTroops"></td>`;
    });
    html += `
                    <td align="center"><input id="packets_send" value="0" type="number" step="any" min="0" class="scriptInput"></td>
                </tr>
                <tr id="reserveTroops">
                    <td>reserva por aldeia (unidades)</td>`;
    exibidas.forEach(function (u) {
      html += `<td align="center"><input id="${u}Reserve" value="0" type="number" min="0" class="scriptInput reserveTroops"></td>`;
    });
    html += `
                    <td></td>
                </tr>
                <tr>
                    <td>reserva (%)</td>
                    <td colspan="${cols - 1}">
                        <input type="number" id="reserve_pct" class="scriptInput" min="0" max="100" value="0" style="width:25%">
                        <span style="font-size:11px"> do estoque de cada tropa fica em casa (vale o maior entre % e unidades)</span>
                    </td>
                </tr>
                <tr>
                    <td>grupo</td>
                    <td colspan="${cols - 1}">
                        <select id="group_select"><option value="0">Todas as aldeias</option></select>
                        <span id="group_info" style="font-size:11px"></span>
                    </td>
                </tr>
                <tr>
                    <td>modo</td>
                    <td colspan="${c1}">
                        <select id="mode_select">
                            <option value="fractioned">Fracionado (um pouco de cada aldeia)</option>
                            <option value="concentrated">Concentrado (poucas aldeias, rápido)</option>
                        </select>
                    </td>
                    <td colspan="${c2}">
                        prioridade:
                        <select id="order_select">
                            <option value="far">Mais longe primeiro</option>
                            <option value="near">Mais perto primeiro</option>
                            <option value="stock">Maior estoque primeiro</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td colspan="1">
                        <center><font color="${textColor}">sigilo:</font><input type="number" id="flag_boost" class="scriptInput" min="0" max="100" placeholder="0" value="0" style="text-align:center"></center>
                    </td>
                    <td colspan="2">
                        <center><input type="checkbox" id="checkbox_window" value="land_specific"><font color="${textColor}"> chegar entre:</font></center>
                    </td>
                    <td colspan="${colsDatas}">
                        <center style="margin:5px">início:<input type="datetime-local" id="start_window" style="text-align:center;"></center>
                        <center style="margin:5px">fim:  <input type="datetime-local" id="stop_window" style="text-align:center;"></center>
                    </td>
                </tr>
                <tr>
                    <td colspan="${cols}">
                        <button type="button" class="btn evt-confirm-btn btn-confirm-yes" id="btn_fill">Preencher</button>
                        <button type="button" class="btn evt-confirm-btn btn-confirm-yes" id="btn_calc">Calcular</button>
                    </td>
                </tr>
            </table>
        </div>
        <div class="scriptFooter">
            <div style="margin-top:5px;"><h5>original: Costache Madalin | versão modificada</h5></div>
        </div>
    </div>`;

    $('#div_container').remove();
    $('#contentContainer').eq(0).prepend(html);
    $('#mobileContent').eq(0).prepend(html);

    $('#div_container').css('position', 'fixed');
    if ($.fn.draggable) $('#div_container').draggable();

    $('#div_close').on('click', function () { $('#div_container').remove(); });
    $('#div_theme_link').on('click', function () { $('#theme_settings').toggle(); });

    $('#div_minimize').on('click', function () {
      var largura = Math.ceil($('#div_container').width() / $('body').width() * 100);
      if (largura >= widthInterface) {
        $('#div_container').css({ width: '10%' });
        $('#div_body').hide();
      } else {
        $('#div_container').css({ width: widthInterface + '%' });
        $('#div_body').show();
      }
    });

    restaurarConfig();
    atualizarOrdem();

    if (game_data.device !== 'desktop') {
      $('#table_upload').find('input[type=text]').css('width', '100%');
    }
  }

  function atualizarOrdem() {
    $('#order_select').prop('disabled', $('#mode_select').val() !== 'concentrated');
  }

  // ---- configuracao salva (por id, entao adicionar campos nao embaralha o que ja foi salvo)

  function salvarConfig() {
    var cfg = {};
    $('#table_upload input, #table_upload select').each(function () {
      if (!this.id || this.disabled) return;
      cfg[this.id] = (this.type === 'checkbox') ? this.checked : this.value;
    });
    try { localStorage.setItem(CHAVE_CONFIG, JSON.stringify(cfg)); } catch (e) { /* ignora */ }
  }

  function lerConfigSalva() {
    try { return JSON.parse(localStorage.getItem(CHAVE_CONFIG) || 'null'); } catch (e) { return null; }
  }

  function restaurarConfig() {
    var cfg = lerConfigSalva();
    if (!cfg) return;
    $('#table_upload input, #table_upload select').each(function () {
      if (!this.id || this.disabled || !(this.id in cfg)) return;
      if (this.id === 'group_select') return;           // restaurado depois que os grupos carregam
      if (this.type === 'checkbox') this.checked = !!cfg[this.id];
      else this.value = cfg[this.id];
    });
  }

  // ---- painel de temas

  function changeTheme() {
    var html = `
    <h3 style="color:${textColor};padding-left:10px;padding-top:5px">depois de escolher o tema, rode o script de novo</h3>
    <table class="scriptTable">
        <tr>
            <td>
                <select id="select_theme">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return '<option value="theme' + n + '">theme' + n + '</option>'; }).join('')}
                </select>
            </td>
            <td>valor</td>
            <td>cor (hex)</td>
        </tr>
        ${[['textColor', textColor], ['backgroundInput', backgroundInput], ['borderColor', borderColor], ['backgroundContainer', backgroundContainer], ['backgroundHeader', backgroundHeader], ['backgroundMainTable', backgroundMainTable], ['backgroundInnerTable', backgroundInnerTable]].map(function (p) {
          return '<tr><td>' + p[0] + '</td><td style="background-color:' + p[1] + '" class="td_background"></td><td><input type="text" class="scriptInput input_theme" value="' + p[1] + '"></td></tr>';
        }).join('')}
        <tr>
            <td>largura</td>
            <td><input type="range" min="25" max="100" class="slider input_theme" id="input_slider_width" value="${widthInterface}"></td>
            <td id="td_width">${widthInterface}%</td>
        </tr>
        <tr>
            <td><input class="btn evt-confirm-btn btn-confirm-yes" type="button" id="btn_save_theme" value="Salvar"></td>
            <td><input class="btn evt-confirm-btn btn-confirm-yes" type="button" id="btn_reset_theme" value="Temas padrão"></td>
            <td></td>
        </tr>
    </table>`;
    $('#theme_settings').append(html).hide();

    function lerTemas() { return new Map(JSON.parse(localStorage.getItem(localStorageThemeName))); }

    $('#select_theme').on('change', function () {
      var nome = $('#select_theme').find(':selected').text();
      var mapTheme = lerTemas();
      var colours = mapTheme.get(nome);
      if (!colours) return;
      Array.from($('.input_theme')).forEach(function (el, i) { el.value = colours[i]; });
      Array.from($('.td_background')).forEach(function (el, i) { el.style.background = colours[i]; });
      mapTheme.set('currentTheme', nome);
      localStorage.setItem(localStorageThemeName, JSON.stringify(Array.from(mapTheme.entries())));
    });

    $('#btn_save_theme').on('click', function () {
      var colours = Array.from($('.input_theme')).map(function (el) { return el.value.toUpperCase().trim(); });
      var nome = $('#select_theme').find(':selected').text();
      for (var i = 0; i < colours.length - 1; i++) {
        if (colours[i].match(/^#[0-9A-F]{6}$/) == null) {
          UI.ErrorMessage('cor inválida: ' + colours[i]);
          return;
        }
      }
      var mapTheme = lerTemas();
      mapTheme.set(nome, colours);
      mapTheme.set('currentTheme', nome);
      localStorage.setItem(localStorageThemeName, JSON.stringify(Array.from(mapTheme.entries())));
      UI.SuccessMessage('cores salvas em ' + nome + '. Rode o script de novo.', 1000);
    });

    $('#btn_reset_theme').on('click', function () {
      localStorage.setItem(localStorageThemeName, defaultTheme);
      UI.SuccessMessage('Rode o script de novo.', 1000);
    });

    $('#input_slider_width').on('input', function () {
      $('#td_width').text($('#input_slider_width').val() + '%');
    });

    var mapAtual = lerTemas();
    document.querySelector('#select_theme').value = mapAtual.get('currentTheme');
  }

  // ------------------------- GRUPOS -------------------------

  function extrairCoords(texto) {
    var m = String(texto || '').match(/\d{1,3}\|\d{1,3}/g);
    return m ? m[m.length - 1] : null;
  }

  async function carregarGrupos() {
    var select = $('#group_select');
    try {
      var texto = await $.ajax({ url: game_data.link_base_pure + 'groups&mode=overview&ajax=load_group_menu', dataType: 'text' });
      var json = JSON.parse(texto);
      var lista = (json && json.result) || [];
      lista.forEach(function (g) {
        if (!g || g.group_id == null || String(g.group_id) === '0' || g.type === 'separator') return;
        select.append($('<option>').val(String(g.group_id)).text(g.name == null ? ('grupo ' + g.group_id) : String(g.name)));
      });
    } catch (e) {
      console.error('[SupportSender] nao consegui listar os grupos', e);
      $('#group_info').text('(não consegui listar os grupos)');
      return;
    }

    // restaura o grupo escolhido da ultima vez, se ainda existir
    var cfg = lerConfigSalva();
    if (cfg && cfg.group_select && cfg.group_select !== '0' && select.find('option[value="' + cfg.group_select + '"]').length) {
      select.val(cfg.group_select);
      var ok = await aplicarGrupo(cfg.group_select);
      if (!ok) select.val('0');
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
      console.warn('[SupportSender] load_villages_from_group falhou, tentando a visao de edificios', e);
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
      console.error('[SupportSender] nao consegui ler as aldeias do grupo', e);
    }
    return null;
  }

  // define o filtro de grupo. Retorna true se deu certo
  async function aplicarGrupo(id) {
    id = String(id == null ? '0' : id);
    if (id === '0') {
      groupCoords = null;
      $('#group_info').text('');
      return true;
    }
    $('#group_info').text('carregando...');
    var set = await carregarAldeiasDoGrupo(id);
    if (!set) {
      groupCoords = null;
      $('#group_info').text('');
      return false;
    }
    groupCoords = set;
    $('#group_info').text(set.size + ' aldeia(s) no grupo');
    return true;
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
      if (isNaN(dateStart.getTime())) UI.ErrorMessage('a data de início está em formato inválido', 2000);
      if (isNaN(dateStop.getTime())) UI.ErrorMessage('a data de fim está em formato inválido', 2000);
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
      UI.ErrorMessage('Não encontrei a aldeia de destino na página.');
      return mapVillages;
    }

    var speeds = getSpeedConstant();
    var k = 1000 / (speeds.worldSpeed * speeds.unitSpeed);
    var speedTroop = {
      snob: 2100 * k, ram: 1800 * k, catapult: 1800 * k, sword: 1320 * k,
      axe: 1080 * k, spear: 1080 * k, archer: 1080 * k,
      heavy: 660 * k, light: 600 * k, marcher: 600 * k, knight: 600 * k, spy: 540 * k
    };

    var pct = parseFloat($('#reserve_pct').val());
    pct = Number.isNaN(pct) ? 0 : Math.min(Math.max(pct, 0), 100);

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

        // reserva: o maior entre as unidades fixas e a porcentagem do estoque
        var reservaUn = parseFloat($('#' + troopName + 'Reserve').val());
        reservaUn = (Number.isNaN(reservaUn) || reservaUn < 0) ? 0 : Math.floor(reservaUn);
        var reservaPct = (COLUNAS.indexOf(troopName) !== -1) ? Math.ceil(totalTroops * pct / 100) : 0;
        var guardar = Math.max(reservaUn, reservaPct);
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

    var objTroopsTotal = { spear: 0, sword: 0, archer: 0, spy: 0, heavy: 0, totalPop: 0 };

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

    var totalPop = 0;
    Object.keys(objTroopsTotal).forEach(function (key) {
      if (COLUNAS.indexOf(key) !== -1 && units.indexOf(key) !== -1) {
        var el = document.getElementById(key + 'total');
        if (el) el.value = (objTroopsTotal[key] / 1000).toFixed(2);
      }
      if (key === 'spear' || key === 'sword' || key === 'archer') totalPop += objTroopsTotal[key];
      else if (key === 'heavy') totalPop += objTroopsTotal[key] * heavyCav;
    });

    document.getElementById('packets_total').value = (totalPop / 1000).toFixed(2);
    lastTotals = objTroopsTotal;
    return mapVillages;
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
    // atualiza o grupo na hora de preencher (se voce mexeu nos grupos no meio tempo)
    if ($('#group_select').val() !== '0') {
      var okGrupo = await aplicarGrupo($('#group_select').val());
      if (!okGrupo) {
        UI.ErrorMessage('Não consegui carregar o grupo. Nada foi preenchido.');
        return;
      }
    }

    var mapVillages = countTotalTroops();
    if (!mapVillages.size) {
      UI.ErrorMessage('Nenhuma aldeia disponível (confira o grupo e a página).');
      return;
    }

    var modo = $('#mode_select').val();
    var ordem = $('#order_select').val();
    var timeWindow = document.getElementById('checkbox_window').checked;

    var sendTotal = Array.from(document.getElementsByClassName('sendTroops')).map(function (e) {
      var v = parseFloat(e.value);
      return { value: Number.isNaN(v) ? 0 : Math.round(v * 1000), troopName: e.id.replace(/send$/, '') };
    });
    var sendTotalObj = {};
    sendTotal.forEach(function (e) { sendTotalObj[e.troopName] = e.value; });

    for (var s = 0; s < sendTotal.length; s++) {
      var un = sendTotal[s].troopName;
      var disponivel = lastTotals[un] || 0;
      if (sendTotal[s].value > disponivel) {
        UI.ErrorMessage('Tropas insuficientes de ' + (NOMES[un] || un) + ': você pediu ' + sendTotal[s].value + ' e há ' + disponivel + ' disponíveis.');
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
      UI.ErrorMessage('Nenhuma aldeia consegue enviar nessas condições.');
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
    var enviado = {};
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
          if (n !== 'speedTroop' && n !== 'coord') {
            $(row).find('.call-unit-box-' + n).val(obj[n]);
            enviado[n] = (enviado[n] || 0) + obj[n];
          }
        });
      }
    });

    var modoTexto = (modo === 'concentrated')
      ? 'concentrado, ' + ({ far: 'mais longe primeiro', near: 'mais perto primeiro', stock: 'maior estoque primeiro' }[ordem] || '')
      : 'fracionado';
    UI.SuccessMessage('Preenchido em ' + usadas + ' aldeia(s) (' + modoTexto + '). Confira e envie.', 4000);
  }

  // ------------------------- EVENTOS -------------------------

  function addEvents() {
    // mudou um campo "enviar": recalcula a populacao
    $('.sendTroops').on('input', function () {
      var sendTotal = document.getElementsByClassName('sendTroops');
      var totalPop = 0;
      for (var i = 0; i < sendTotal.length; i++) {
        var id = sendTotal[i].id;
        var value = (sendTotal[i].value === '') ? 0 : parseFloat(sendTotal[i].value);
        if (id.indexOf('spear') === 0 || id.indexOf('sword') === 0 || id.indexOf('archer') === 0) totalPop += value * 1000;
        if (id.indexOf('heavy') === 0) totalPop += value * 1000 * heavyCav;
      }
      document.getElementById('packets_send').value = (totalPop / 1000).toFixed(2);
    });

    // mudou a populacao desejada: reparte proporcionalmente entre as tropas
    $('#packets_send').on('input', function () {
      var need = parseFloat(document.getElementById('packets_send').value);
      var totalPop = parseFloat(document.getElementById('packets_total').value);
      if (!(totalPop > 0) || Number.isNaN(need)) return;
      var sendTotal = document.getElementsByClassName('sendTroops');
      var totalTroops = document.getElementsByClassName('totalTroops');
      var ratio = need / totalPop;
      for (var i = 0; i < totalTroops.length; i++) {
        var id = sendTotal[i].id;
        if (id.indexOf('spy') !== 0) {
          sendTotal[i].value = parseInt(parseFloat(totalTroops[i].value) * ratio * 100, 10) / 100.0;
        } else {
          sendTotal[i].value = 0;
        }
      }
    });

    $('#table_upload').on('click input change', 'input, select', function () {
      countTotalTroops();
      salvarConfig();
    });

    $('#mode_select').on('change', atualizarOrdem);

    $('#group_select').on('change', async function () {
      var ok = await aplicarGrupo($(this).val());
      if (!ok) {
        $('#group_select').val('0');
        UI.ErrorMessage('Não consegui carregar as aldeias desse grupo. Usando todas as aldeias.');
      }
      countTotalTroops();
      salvarConfig();
    });

    $('#btn_fill').on('click', function () {
      fillInputs().catch(function (e) {
        console.error('[SupportSender] erro ao preencher', e);
        UI.ErrorMessage('Erro ao preencher (veja o console, F12).');
      });
    });
    $('#btn_calc').on('click', function () { countTotalTroops(); });
  }

  // ------------------------- INICIO -------------------------

  async function main() {
    initializationTheme();
    addCssStyle();
    createMainInterface();
    changeTheme();
    addEvents();
    carregarGrupos();
  }

  main().catch(function (e) {
    console.error('[SupportSender] erro ao iniciar', e);
    UI.ErrorMessage('Erro ao iniciar o script (veja o console, F12).');
  });
})();
