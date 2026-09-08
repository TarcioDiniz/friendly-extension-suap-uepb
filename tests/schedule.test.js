'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
    formatMinutes,
    parseScheduleCode,
    formatSchedule,
    formatScheduleList,
    isScheduleCode,
} = require('../src/schedule.js');

test('formatMinutes escreve hora cheia e hora quebrada', () => {
    assert.strictEqual(formatMinutes(7 * 60), '07h');
    assert.strictEqual(formatMinutes(13 * 60), '13h');
    assert.strictEqual(formatMinutes(19 * 60 + 50), '19h50min');
});

test('aulas seguidas viram um intervalo só', () => {
    assert.strictEqual(formatSchedule('2M12'), 'Segunda 07h às 09h');
    assert.strictEqual(formatSchedule('4N1234'), 'Quarta 19h às 22h20min');
});

test('aulas separadas viram intervalos separados', () => {
    assert.strictEqual(formatSchedule('2M136'), 'Segunda 07h às 08h, 09h às 10h, 12h às 13h');
});

test('aula única', () => {
    assert.strictEqual(formatSchedule('7T1'), 'Sábado 13h às 14h');
});

test('vespertino usa o mesmo horário da tarde', () => {
    assert.strictEqual(formatSchedule('3V12'), formatSchedule('3T12'));
});

test('código inválido volta intacto em vez de quebrar', () => {
    // Aula 9 não existe no noturno — era aqui que o código antigo estourava.
    assert.strictEqual(formatSchedule('2N9'), '2N9');
    // Dia 1 e dia 8 não existem.
    assert.strictEqual(formatSchedule('1M12'), '1M12');
    assert.strictEqual(formatSchedule('8M12'), '8M12');
    assert.strictEqual(formatSchedule('qualquer coisa'), 'qualquer coisa');
    assert.strictEqual(formatSchedule(''), '');
});

test('parseScheduleCode devolve null para código desconhecido', () => {
    assert.strictEqual(parseScheduleCode('2X12'), null);
    assert.strictEqual(parseScheduleCode('2M70'), null);
});

test('lista separada por barra', () => {
    assert.strictEqual(
        formatScheduleList('2M12 / 4N34'),
        'Segunda 07h às 09h / Quarta 20h40min às 22h20min'
    );
    assert.strictEqual(formatScheduleList(' 2M12'), 'Segunda 07h às 09h');
});

test('isScheduleCode reconhece o que ainda não foi convertido', () => {
    assert.strictEqual(isScheduleCode('2M12'), true);
    assert.strictEqual(isScheduleCode('2M12 / 4N34'), true);
    assert.strictEqual(isScheduleCode('Segunda 07h às 09h'), false);
    assert.strictEqual(isScheduleCode(''), false);
});
