function convertSchoolSchedule(hour) {
    const daysWeek = {
        2: 'Segunda',
        3: 'Terça',
        4: 'Quarta',
        5: 'Quinta',
        6: 'Sexta',
        7: 'Sábado',
    };

    const hoursMorning = {
        1: '07h às 08h',
        2: '08h às 09h',
        3: '09h às 10h',
        4: '10h às 11h',
        5: '11h às 12h',
        6: '12h às 13h',
    };

    const hoursAfternoon = {
        1: '13h às 14h',
        2: '14h às 15h',
        3: '15h às 16h',
        4: '16h às 17h',
        5: '17h às 18h',
        6: '18h às 19h',
    };

    const hoursNight = {
        1: '19h às 19h50min',
        2: '19h50min às 20h40min',
        3: '20h40min às 21h30min',
        4: '21h30min às 22h20min',
    };

    const hoursArrayComplete = [];

    const regex = /^(\d+)([MNTV])(\d+)$/;
    const match = hour.match(regex);

    if (match) {
        const [_, dayWeekNumber, shift, hourNumber] = match;
        const dayWeek = daysWeek[dayWeekNumber];

        let hourArray = [dayWeek];
        const hourNumberArray = hourNumber.toString().split('');

        const timeSlots = {
            M: hoursMorning,
            T: hoursAfternoon,
            N: hoursNight,
            V: hoursAfternoon,
        };

        consolidateTimeSlots(hourNumberArray, timeSlots[shift], hourArray);

        hoursArrayComplete.push(hourArray.join(' '));

        return hoursArrayComplete.join(' ');
    }

    return hour;

}

function consolidateTimeSlots(timeArray, timeSlots, resultArray) {
    let start = null;
    let end = null;

    timeArray.forEach(h => {
        const timeSlot = timeSlots[Number(h)];

        if (start === null) {
            start = timeSlot.split(' ')[0];
            end = timeSlot.split(' ')[2];
        } else if (end === timeSlot.split(' ')[0]) {
            end = timeSlot.split(' ')[2];
        } else {
            resultArray.push(`${start} às ${end}`);
            start = timeSlot.split(' ')[0];
            end = timeSlot.split(' ')[2];
        }
    });

    if (start !== null) {
        resultArray.push(`${start} às ${end}`);
    }
}

function removeColumnDescription(tabela) {
    const columnDescription = Array.from(tabela.querySelectorAll('thead th')).find(th => th.textContent.trim() === 'Descrição');

    if (columnDescription) {
        columnDescription.remove();

        const linhasTabela = tabela.querySelectorAll('tbody tr');
        linhasTabela.forEach(linha => {
            const cellDescription = linha.querySelector('td:nth-child(4)'); // Assuming the 'Descrição' column is the 4th column (index 3)
            if (cellDescription) {
                cellDescription.remove();
            }
        });
    }
}

function convertSchoolScheduleInTable() {
    const tabelasResponsivas = document.querySelectorAll('div.table-responsive');

    tabelasResponsivas.forEach(tabela => {
        removeColumnDescription(tabela);

        const tableHourSelector = 'table tbody tr td:nth-child(5)';
        const columnHour = tabela.querySelectorAll(tableHourSelector);

        columnHour.forEach((elemento) => {
            const originalHour = elemento.textContent.trim();
            const hourOriginalArray = originalHour.includes('/') ? originalHour.split('/') : [originalHour]
            const hourConverted = [];
            hourOriginalArray.forEach(h => {
                hourConverted.push(convertSchoolSchedule(h.replace(/\s/g, '')));
            });
            elemento.textContent = hourConverted.join(' / ');
        });
    });
}

window.addEventListener('load', convertSchoolScheduleInTable);
