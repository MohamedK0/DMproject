// ========== FP-Growth Main Controller ========== //

// HTML Elements
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const fpGrowthParametersSection = document.getElementById('parametersSection');
const runButton = document.getElementById('runBtn');
const resultsSection = document.getElementById('resultsSection');
const minSupportParameter = document.getElementById('minSupport');
const minConfidenceParameter = document.getElementById('minConfidence');

let originalRawData = [];
let finalTransactions = [];

// Event Listeners
fileInput.addEventListener('change', onFileChosen);
runButton.addEventListener('click', onRunFPGrowth);
minSupportParameter.addEventListener('input', validateFPGrowthInputs);
minConfidenceParameter.addEventListener('input', validateFPGrowthInputs);

// Read And Preprocess Uploaded Excel File
async function onFileChosen(event) {
    const file = event.target.files[0];
    if (!file) return;

    fileName.textContent = file.name;
    resultsSection.innerHTML = '<div class="info-message">Processing file...</div>';

    try {
        const rows = await readExcel(file);
        if (!rows || rows.length === 0) throw new Error('No data found in the file');

        originalRawData = rows;
        runPreprocessingPhase();
    } catch (err) {
        resultsSection.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
        console.error(err);
    }
}

// Run FP-Growth Algorithm
async function onRunFPGrowth() {
    resultsSection.innerHTML = '';

    if (!finalTransactions.length) {
        resultsSection.innerHTML = '<div class="error-message">Please upload a valid Excel file first.</div>';
        return;
    }

    const totalTransactions = finalTransactions.length;
    const minSupport = Number(minSupportParameter.value) / 100;
    const minSupportCount = minSupport * totalTransactions;
    const minConfidence = Number(minConfidenceParameter.value) / 100;

    // Display Horizontal Transaction Data
    appendStep('Horizontal Transaction Data', getHorizontalTransactionsTable(finalTransactions), true);

    // Build FP-Tree And Mine Frequent Itemsets
    const result = getAllFrequentItemSets(finalTransactions, minSupportCount);
    const fpTreeData = result.fpTreeData;
    const allLevels = result.allLevels;

    appendStep('FP-Tree Header Table', getHeaderTableRows(fpTreeData.headerTable), true);
    appendStep('FP-Tree Representation', getFPTreeRows(fpTreeData.root), true);
    displayAllLevels(allLevels);

    // Generate All Association Rules
    const allRules = generateAllAssRules(allLevels, totalTransactions);
    displayAllAssRules(allRules);

    // Extract Strong Rules
    const strongRules = pruneStrongRules(allRules, minConfidence);
    displayAssRules(strongRules, allLevels, totalTransactions);

    appendStep('Run Summary', [{
        'Transactions': totalTransactions,
        'Minimum Support': (minSupport * 100).toFixed(2) + '%',
        'Minimum Support Count': minSupportCount.toFixed(2),
        'Minimum Confidence': (minConfidence * 100).toFixed(2) + '%',
        'Frequent Itemsets': result.frequentItemsets.size,
        'All Rules': allRules.length,
        'Strong Rules': strongRules.length
    }], true);
}

// Convert Excel File To JSON Rows
function readExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                const rows = [];
                // Skip Header Row (TID, Items)
                for (let i = 1; i < json.length; i++) {
                    const row = json[i];
                    if (row[0] !== undefined && row[1] !== undefined && row[1] !== '') {
                        rows.push({
                            tid: row[0].toString(),
                            items: row[1].toString()
                        });
                    }
                }
                resolve(rows);
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

// Run Data Formatting And Duplicate Removal
function runPreprocessingPhase() {
    resultsSection.innerHTML = '';

    const formatted = formatRowData(originalRawData);
    appendStep('Reformatted Transactions', formatted.formattedTable, true);

    const cleaned = deleteDuplicates(formatted.formattedTransactions);
    appendStep('Transactions (Duplicates Removed)', cleaned.cleanedTable, true);

    finalTransactions = cleaned.cleanedTransactions;
    fpGrowthParametersSection.style.display = 'block';
    validateFPGrowthInputs();
}

// Prepare Horizontal Transaction Table
function getHorizontalTransactionsTable(transactions) {
    return transactions.map(transaction => ({
        'Transaction ID': transaction.tid,
        'Items': transaction.items.join(', ')
    }));
}

// Validate Algorithm Parameters
function validateFPGrowthInputs() {
    const minSupport = parseFloat(minSupportParameter.value);
    const minConfidence = parseFloat(minConfidenceParameter.value);

    const validSupport = !Number.isNaN(minSupport) && minSupport > 0 && minSupport <= 100;
    const validConfidence = !Number.isNaN(minConfidence) && minConfidence >= 0 && minConfidence <= 100;

    runButton.disabled = !(validSupport && validConfidence && finalTransactions.length > 0);
}
