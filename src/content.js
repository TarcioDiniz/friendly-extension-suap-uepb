'use strict';

/**
 * Camada de DOM: acha as tabelas do SUAP e aplica as melhorias.
 * A lógica de horário vive em src/schedule.js.
 */

const TABLE_SELECTOR = 'div.table-responsive table';
const SCHEDULE_HEADERS = ['horario', 'horarios', 'horario/local'];
const DESCRIPTION_HEADER = 'descricao';

/** Tira acento, espaço extra e maiúscula — para comparar cabeçalhos. */
function normalize(text) {
    return String(text)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

/** Índice da coluna cujo cabeçalho bate com um dos nomes. -1 se não achar. */
function findColumnIndex(table, names) {
    const headers = Array.from(table.querySelectorAll('thead th'));

    return headers.findIndex(header => names.includes(normalize(header.textContent)));
}

function bodyRows(table) {
    return Array.from(table.querySelectorAll('tbody tr'));
}

/**
 * Troca o texto da célula sem destruir o que está dentro dela.
 * Se houver um único trecho de texto, só esse trecho muda — links e ícones
 * continuam de pé.
 */
function setCellText(cell, text) {
    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    const textNodes = [];

    while (walker.nextNode()) {
        if (walker.currentNode.nodeValue.trim() !== '') {
            textNodes.push(walker.currentNode);
        }
    }

    if (textNodes.length === 1) {
        textNodes[0].nodeValue = text;
        return;
    }

    cell.textContent = text;
}

/** Converte os códigos de horário da coluna "Horário". */
function convertScheduleColumn(table) {
    const columnIndex = findColumnIndex(table, SCHEDULE_HEADERS);

    if (columnIndex === -1) {
        return;
    }

    bodyRows(table).forEach(row => {
        const cell = row.children[columnIndex];

        if (!cell || cell.dataset.suapSchedule === 'done') {
            return;
        }

        const original = cell.textContent.trim();

        if (!isScheduleCode(original)) {
            return;
        }

        setCellText(cell, formatScheduleList(original));
        cell.dataset.suapSchedule = 'done';
    });
}

/** Remove a coluna "Descrição" inteira (cabeçalho + células). */
function removeDescriptionColumn(table) {
    const columnIndex = findColumnIndex(table, [DESCRIPTION_HEADER]);

    if (columnIndex === -1) {
        return;
    }

    bodyRows(table).forEach(row => {
        const cell = row.children[columnIndex];

        if (cell) {
            cell.remove();
        }
    });

    table.querySelectorAll('thead th')[columnIndex].remove();
}

/**
 * Lê os títulos da página (h4) e monta { "GRAD.1234": "Nome da Disciplina" }.
 * O formato do SUAP é: "5º Período | GRAD.1234 - Nome - Graduação [60 h/60 Aulas]".
 */
function subjectNamesByCode() {
    const pattern = /\|\s*(GRAD\.\d+)\s*-\s*(.+?)\s*-\s*Gradua/i;
    const names = {};

    document.querySelectorAll('h4').forEach(heading => {
        const match = heading.textContent.trim().match(pattern);

        if (match) {
            names[match[1]] = match[2];
        }
    });

    return names;
}

/** Troca o código da disciplina pelo nome dela na tabela de solicitações. */
function updateSubjectNames(table, names) {
    if (Object.keys(names).length === 0) {
        return;
    }

    table.querySelectorAll('td, th').forEach(cell => {
        if (cell.dataset.suapSubject === 'done') {
            return;
        }

        const code = cell.textContent.trim();

        if (!Object.prototype.hasOwnProperty.call(names, code)) {
            return;
        }

        setCellText(cell, names[code]);
        cell.dataset.suapSubject = 'done';
    });
}

function enhance() {
    const names = subjectNamesByCode();

    document.querySelectorAll(TABLE_SELECTOR).forEach(table => {
        convertScheduleColumn(table);
        updateSubjectNames(table, names);

        // A remoção muda os índices das colunas, então vem por último.
        if (table.dataset.suapDescription !== 'removed') {
            removeDescriptionColumn(table);
            table.dataset.suapDescription = 'removed';
        }
    });
}

/**
 * O SUAP carrega várias tabelas por AJAX, depois do load. O observer pega
 * essas. O debounce evita rodar a cada nó inserido.
 */
function watchForNewTables() {
    let scheduled = null;

    const observer = new MutationObserver(() => {
        if (scheduled !== null) {
            return;
        }

        scheduled = setTimeout(() => {
            scheduled = null;
            enhance();
        }, 150);
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
}

function start() {
    enhance();
    watchForNewTables();
}

// O content script costuma rodar depois do evento 'load'. Se esperarmos por
// ele sem checar, o código nunca executa.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
