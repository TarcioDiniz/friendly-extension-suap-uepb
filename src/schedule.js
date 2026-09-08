'use strict';

/**
 * Conversão dos códigos de horário do SUAP ("2M12") para texto legível
 * ("Segunda 07h às 09h").
 *
 * Este arquivo não toca no DOM. É carregado como script clássico na extensão
 * (expõe os nomes no escopo global) e como módulo CommonJS nos testes.
 */

const WEEKDAYS = {
    2: 'Segunda',
    3: 'Terça',
    4: 'Quarta',
    5: 'Quinta',
    6: 'Sexta',
    7: 'Sábado',
};

/**
 * Cada aula é um par [início, fim] em minutos desde a meia-noite.
 * O índice do array é o número da aula usado no código do SUAP.
 */
const SHIFT_SLOTS = {
    // Matutino
    M: {
        1: [7 * 60, 8 * 60],
        2: [8 * 60, 9 * 60],
        3: [9 * 60, 10 * 60],
        4: [10 * 60, 11 * 60],
        5: [11 * 60, 12 * 60],
        6: [12 * 60, 13 * 60],
    },
    // Tarde
    T: {
        1: [13 * 60, 14 * 60],
        2: [14 * 60, 15 * 60],
        3: [15 * 60, 16 * 60],
        4: [16 * 60, 17 * 60],
        5: [17 * 60, 18 * 60],
        6: [18 * 60, 19 * 60],
    },
    // Noturno
    N: {
        1: [19 * 60, 19 * 60 + 50],
        2: [19 * 60 + 50, 20 * 60 + 40],
        3: [20 * 60 + 40, 21 * 60 + 30],
        4: [21 * 60 + 30, 22 * 60 + 20],
    },
};

// Vespertino é o mesmo intervalo do turno da tarde.
SHIFT_SLOTS.V = SHIFT_SLOTS.T;

const SCHEDULE_CODE = /^(\d)([MTVN])(\d+)$/;

/** 420 -> "07h"; 1190 -> "19h50min" */
function formatMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const paddedHours = String(hours).padStart(2, '0');

    if (minutes === 0) {
        return `${paddedHours}h`;
    }

    return `${paddedHours}h${String(minutes).padStart(2, '0')}min`;
}

/** Junta aulas encostadas uma na outra num único intervalo. */
function mergeRanges(ranges) {
    const merged = [];

    ranges.forEach(([start, end]) => {
        const last = merged[merged.length - 1];

        if (last && last[1] === start) {
            last[1] = end;
            return;
        }

        merged.push([start, end]);
    });

    return merged;
}

/**
 * Lê um código do SUAP. Devolve null se o código não existir ou apontar para
 * um dia/aula que não conhecemos — assim um código estranho nunca quebra a
 * página, só fica como estava.
 */
function parseScheduleCode(code) {
    const match = String(code).trim().toUpperCase().match(SCHEDULE_CODE);

    if (!match) {
        return null;
    }

    const [, weekdayNumber, shift, lessonNumbers] = match;
    const weekday = WEEKDAYS[weekdayNumber];
    const slots = SHIFT_SLOTS[shift];

    if (!weekday || !slots) {
        return null;
    }

    const ranges = [];

    for (const lessonNumber of lessonNumbers.split('')) {
        const range = slots[lessonNumber];

        if (!range) {
            return null;
        }

        ranges.push([range[0], range[1]]);
    }

    return { weekday, shift, ranges: mergeRanges(ranges) };
}

/** "2M12" -> "Segunda 07h às 09h". Código desconhecido volta intacto. */
function formatSchedule(code) {
    const parsed = parseScheduleCode(code);

    if (!parsed) {
        return String(code);
    }

    const ranges = parsed.ranges
        .map(([start, end]) => `${formatMinutes(start)} às ${formatMinutes(end)}`)
        .join(', ');

    return `${parsed.weekday} ${ranges}`;
}

/** "2M12 / 4N34" -> "Segunda 07h às 09h / Quarta 20h40min às 22h20min". */
function formatScheduleList(text) {
    return String(text)
        .split('/')
        .map(part => formatSchedule(part.replace(/\s/g, '')))
        .join(' / ');
}

/** Já foi convertido? Evita processar a mesma célula duas vezes. */
function isScheduleCode(text) {
    return String(text)
        .split('/')
        .some(part => SCHEDULE_CODE.test(part.replace(/\s/g, '').toUpperCase()));
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WEEKDAYS,
        SHIFT_SLOTS,
        formatMinutes,
        mergeRanges,
        parseScheduleCode,
        formatSchedule,
        formatScheduleList,
        isScheduleCode,
    };
}
