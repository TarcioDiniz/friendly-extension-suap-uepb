'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const SCHEDULE_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'schedule.js'), 'utf8');
const CONTENT_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'content.js'), 'utf8');

/** Monta uma página com as tabelas e roda a extensão nela. */
async function loadPage(html) {
    const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
        runScripts: 'dangerously',
    });

    // Injeta como <script> de verdade, do mesmo jeito que a extensão carrega.
    [SCHEDULE_SRC, CONTENT_SRC].forEach(source => {
        const script = dom.window.document.createElement('script');
        script.textContent = source;
        dom.window.document.body.appendChild(script);
    });

    // O jsdom ainda pode estar montando o documento; a extensão espera o
    // DOMContentLoaded nesse caso.
    if (dom.window.document.readyState === 'loading') {
        await new Promise(resolve => {
            dom.window.document.addEventListener('DOMContentLoaded', resolve);
        });
    }

    return dom;
}

/** Tabela igual à do SUAP: a coluna Descrição vem antes da coluna Horário. */
function tableWithDescription(scheduleCell) {
    return `
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>#</th><th>Código</th><th>Disciplina</th>
                        <th>Descrição</th><th>Horário</th><th>Local</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td><td>GRAD.1234</td><td>Cálculo</td>
                        <td>texto longo</td><td>${scheduleCell}</td><td>Sala 5</td>
                    </tr>
                </tbody>
            </table>
        </div>`;
}

function cells(dom) {
    return Array.from(dom.window.document.querySelectorAll('tbody td'))
        .map(td => td.textContent.trim());
}

test('converte a coluna Horário certa mesmo com a coluna Descrição na frente', async () => {
    const dom = await loadPage(tableWithDescription('2M12'));

    // Era aqui que o código antigo errava: apagava Descrição e depois lia a
    // 5ª célula, que já tinha virado outra coluna.
    assert.deepStrictEqual(cells(dom), ['1', 'GRAD.1234', 'Cálculo', 'Segunda 07h às 09h', 'Sala 5']);
});

test('remove a coluna Descrição do cabeçalho e do corpo', async () => {
    const dom = await loadPage(tableWithDescription('2M12'));
    const headers = Array.from(dom.window.document.querySelectorAll('thead th'))
        .map(th => th.textContent.trim());

    assert.deepStrictEqual(headers, ['#', 'Código', 'Disciplina', 'Horário', 'Local']);
});

test('mantém o link dentro da célula de horário', async () => {
    const dom = await loadPage(tableWithDescription('<a href="/turma/1">2M12</a>'));
    const link = dom.window.document.querySelector('tbody a');

    assert.ok(link, 'o link foi destruído');
    assert.strictEqual(link.getAttribute('href'), '/turma/1');
    assert.strictEqual(link.textContent, 'Segunda 07h às 09h');
});

test('horário inválido não quebra a página nem some da tela', async () => {
    const dom = await loadPage(tableWithDescription('2N9'));

    assert.deepStrictEqual(cells(dom), ['1', 'GRAD.1234', 'Cálculo', '2N9', 'Sala 5']);
});

test('troca o código da disciplina pelo nome que está no h4', async () => {
    const dom = await loadPage(`
        <h4>5º Período | GRAD.1234 - Cálculo Diferencial - Graduação [60 h/60 Aulas]</h4>
        ${tableWithDescription('2M12')}`);

    assert.ok(cells(dom).includes('Cálculo Diferencial'));
});

test('tabela sem coluna Horário fica intacta', async () => {
    const dom = await loadPage(`
        <div class="table-responsive">
            <table>
                <thead><tr><th>#</th><th>Nota</th></tr></thead>
                <tbody><tr><td>1</td><td>8,5</td></tr></tbody>
            </table>
        </div>`);

    assert.deepStrictEqual(cells(dom), ['1', '8,5']);
});

test('tabela carregada depois (AJAX) também é convertida', async () => {
    const dom = await loadPage('<div id="alvo"></div>');

    dom.window.document.getElementById('alvo').innerHTML = tableWithDescription('4N34');

    // O observer tem debounce de 150ms.
    await new Promise(resolve => setTimeout(resolve, 400));

    assert.ok(cells(dom).includes('Quarta 20h40min às 22h20min'));
});

test('rodar duas vezes não converte a mesma célula de novo', async () => {
    const dom = await loadPage(tableWithDescription('2M12'));

    dom.window.eval('enhance(); enhance();');

    assert.deepStrictEqual(cells(dom), ['1', 'GRAD.1234', 'Cálculo', 'Segunda 07h às 09h', 'Sala 5']);
});
