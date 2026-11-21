// Format Data Into Clean Format
function formatRowData(rawData) {
    var formattedTransactions = [];
    var formattedTable = [];

    for (var i = 0; i < rawData.length; i++) {
        var testRow = rawData[i];
        var arrayItems = testRow.items.split(',');

        var items = [];
        for (var j = 0; j < arrayItems.length; j++) {
            var item = arrayItems[j].trim(); // Remove Spaces or Empty
            if (item) {
                items.push(item);
            }
        }

        var realRow = {
            tid: testRow.tid,
            items: items
        };
        formattedTransactions.push(realRow); // For Apriori Logic

        formattedTable.push({
            'Transaction ID': realRow.tid,
            'Items': items.join(', ')
        }); // For Visualization
    }

    return {
        formattedTransactions,
        formattedTable
    };
}

// Remove Duplicates
function deleteDuplicates(formattedTransactions) {
    var cleanedTransactions = [];
    var cleanedTable = [];

    for (var i = 0; i < formattedTransactions.length; i++) {
        var testRow = formattedTransactions[i];

        var uniqueItemsPerRow = [];
        for (var j = 0; j < testRow.items.length; j++) {
            var item = testRow.items[j];
            var isFound = false;

            for (var k = 0; k < uniqueItemsPerRow.length; k++) {
                if (uniqueItemsPerRow[k] === item) {
                    isFound = true;
                    break;
                }
            }

            if (!isFound) { // If Not Duplicated
                uniqueItemsPerRow.push(item);
            }
        }

        var cleanRow = {
            tid: testRow.tid,
            items: uniqueItemsPerRow
        };
        cleanedTransactions.push(cleanRow); // For Apriori Logic

        cleanedTable.push({
            'Transaction ID': cleanRow.tid,
            'Items': uniqueItemsPerRow.join(', ')
        }); // For Visualization
    }

    return {
        cleanedTransactions,
        cleanedTable
    };
}