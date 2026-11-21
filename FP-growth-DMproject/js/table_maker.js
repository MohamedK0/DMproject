// Add Sub-Section To Results
function appendStep(title, rows, expanded) {
    var results = document.getElementById('resultsSection');

    var container = document.createElement('div');
    container.className = 'step-container';

    var titleEl = document.createElement('h3');
    titleEl.className = 'step-title';
    titleEl.textContent = title;

    var content = document.createElement('div');
    content.className = 'step-content';

    if (rows && rows.length) {
        content.appendChild(buildTable(rows));
    } else {
        content.innerHTML = '<p>No data to display</p>';
    }

    container.appendChild(titleEl);
    container.appendChild(content);
    results.appendChild(container);
}

// Build HTML Table
function buildTable(rows) {
    var table = document.createElement('table');

    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');

    var keys = [];
    // Column Names
    for (var key in rows[0]) {
        keys.push(key);
    }

    // Header
    for (var i = 0; i < keys.length; i++) {
        var th = document.createElement('th');
        th.textContent = keys[i];
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');

    // Body
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var tr = document.createElement('tr');

        for (var j = 0; j < keys.length; j++) {
            var k = keys[j];
            var td = document.createElement('td');
            td.textContent = row[k];

            // Status Colors
            if (k === 'Status') {
                var value = String(row[k]);
                if (value.indexOf('Pruned') !== -1) {
                    td.style.color = '#c62828';
                } else if (value.indexOf('Frequent') !== -1) {
                    td.style.color = '#388e3c';
                    td.style.fontWeight = 'bold';
                } else if (value.indexOf('Strong Rule') !== -1) {
                    td.style.color = '#388e3c';
                    td.style.fontWeight = 'bold';
                }
            }

            // Lift Colors
            if (k === 'Lift') {
                var liftValue = parseFloat(row[k]);
                if (!isNaN(liftValue)) {
                    if (liftValue > 1) {
                        td.style.color = '#388e3c';
                        td.style.fontWeight = 'bold';
                        td.style.backgroundColor = '#e8f5e9';
                    } else if (liftValue < 1) {
                        td.style.color = '#c62828';
                        td.style.backgroundColor = '#ffebee';
                    } else {
                        td.style.color = '#666';
                        td.style.backgroundColor = '#f5f5f5';
                    }
                }
            }

            // Confidence Colors
            if (k === 'Confidence') {
                var confValue = parseFloat(String(row[k]).replace('%', ''));
                if (!isNaN(confValue)) {
                    if (confValue >= 80) {
                        td.style.color = '#388e3c';
                        td.style.fontWeight = 'bold';
                    } else if (confValue >= 60) {
                        td.style.color = '#f57c00';
                    }
                }
            }

            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    return table;
}