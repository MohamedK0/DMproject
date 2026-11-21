// ========== FP-Growth Algorithm Functions ========== //

// FP-Tree Node
class FPNode {
    constructor(item, parent) {
        this.item = item;
        this.count = 0;
        this.parent = parent;
        this.children = new Map();
        this.nodeLink = null;
    }
}

// Build FP-Tree
function buildFPTree(finalTransactions, minSupportCount) {
    const itemCounts = new Map();

    // Count each item in all transactions
    for (const transaction of finalTransactions) {
        for (const item of new Set(transaction.items)) {
            itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
        }
    }

    // Keep only frequent items
    const frequentItems = new Map();
    for (const [item, count] of itemCounts) {
        if (count >= minSupportCount) frequentItems.set(item, count);
    }

    if (frequentItems.size === 0) {
        return { root: new FPNode(null, null), headerTable: new Map(), itemCounts: frequentItems };
    }

    const headerTable = new Map();
    for (const [item, count] of frequentItems) {
        headerTable.set(item, { support: count, head: null, tail: null });
    }

    const root = new FPNode(null, null);

    // Sort items in each transaction by descending global frequency
    for (const transaction of finalTransactions) {
        const orderedItems = transaction.items
            .filter(item => frequentItems.has(item))
            .sort((a, b) => {
                const countDiff = frequentItems.get(b) - frequentItems.get(a);
                return countDiff !== 0 ? countDiff : String(a).localeCompare(String(b));
            });

        if (orderedItems.length > 0) {
            insertTransaction(orderedItems, root, headerTable);
        }
    }

    return { root, headerTable, itemCounts: frequentItems };
}

// Insert One Ordered Transaction Into FP-Tree
function insertTransaction(items, root, headerTable) {
    let currentNode = root;

    for (const item of items) {
        if (currentNode.children.has(item)) {
            currentNode = currentNode.children.get(item);
            currentNode.count++;
        } else {
            const newNode = new FPNode(item, currentNode);
            newNode.count = 1;
            currentNode.children.set(item, newNode);

            const headerItem = headerTable.get(item);
            if (headerItem.head === null) {
                headerItem.head = newNode;
                headerItem.tail = newNode;
            } else {
                headerItem.tail.nodeLink = newNode;
                headerItem.tail = newNode;
            }

            currentNode = newNode;
        }
    }
}

// Get Conditional Pattern Base For One Item
function getConditionalPatternBase(item, headerTable) {
    const conditionalPatternBase = [];
    const headerItem = headerTable.get(item);
    if (!headerItem) return conditionalPatternBase;

    let currentNode = headerItem.head;
    while (currentNode) {
        const path = [];
        let parentNode = currentNode.parent;

        while (parentNode && parentNode.item !== null) {
            path.push(parentNode.item);
            parentNode = parentNode.parent;
        }

        if (path.length > 0) {
            conditionalPatternBase.push({ items: path.reverse(), count: currentNode.count });
        }
        currentNode = currentNode.nodeLink;
    }

    return conditionalPatternBase;
}

// Build Conditional FP-Tree From Conditional Pattern Base
function buildConditionalFPTree(conditionalPatternBase, minSupportCount) {
    const conditionalTransactions = [];
    for (const pattern of conditionalPatternBase) {
        for (let i = 0; i < pattern.count; i++) {
            conditionalTransactions.push({ tid: '', items: pattern.items });
        }
    }
    return buildFPTree(conditionalTransactions, minSupportCount);
}

// Mine Frequent Itemsets Recursively
function mineFPTree(headerTable, minSupportCount, suffix, frequentItemsets) {
    const sortedItems = Array.from(headerTable.keys()).sort((a, b) => {
        const countDiff = headerTable.get(a).support - headerTable.get(b).support;
        return countDiff !== 0 ? countDiff : String(a).localeCompare(String(b));
    });

    for (const item of sortedItems) {
        const newPattern = [...suffix, item].sort((a, b) => String(a).localeCompare(String(b)));
        const supportCount = headerTable.get(item).support;
        frequentItemsets.set(newPattern.join('|||'), {
            items: newPattern,
            count: supportCount
        });

        const conditionalPatternBase = getConditionalPatternBase(item, headerTable);
        if (conditionalPatternBase.length === 0) continue;

        const conditionalTree = buildConditionalFPTree(conditionalPatternBase, minSupportCount);
        if (conditionalTree.headerTable.size > 0) {
            mineFPTree(
                conditionalTree.headerTable,
                minSupportCount,
                newPattern,
                frequentItemsets
            );
        }
    }
}

// Generate All Frequent Itemsets (L1, L2, ..., LK)
function getAllFrequentItemSets(finalTransactions, minSupportCount) {
    const fpTreeData = buildFPTree(finalTransactions, minSupportCount);
    const frequentItemsets = new Map();

    if (fpTreeData.headerTable.size > 0) {
        mineFPTree(fpTreeData.headerTable, minSupportCount, [], frequentItemsets);
    }

    const allLevels = [];
    let maxLevel = 0;
    for (const value of frequentItemsets.values()) {
        maxLevel = Math.max(maxLevel, value.items.length);
    }

    for (let levelNumber = 1; levelNumber <= maxLevel; levelNumber++) {
        const levelItems = new Map();
        for (const value of frequentItemsets.values()) {
            if (value.items.length === levelNumber) {
                levelItems.set(value.items, value.count);
            }
        }
        if (levelItems.size > 0) {
    const sortedLevelItems = Array.from(levelItems.entries()).sort(
        ([itemsA, countA], [itemsB, countB]) => {
            const supportDiff = countB - countA;

            if (supportDiff !== 0) return supportDiff;

            return itemsA.join('|||').localeCompare(
                itemsB.join('|||')
            );
        }
    );

    allLevels.push({
        level: levelNumber,
        L: new Map(sortedLevelItems)
    });
}
    }

    return { fpTreeData, frequentItemsets, allLevels };
}

// Generate All Association Rules
function generateAllAssRules(allLevels, totalTransactions) {
    const allRules = [];
    const supportLookup = new Map();

    for (const levelData of allLevels) {
        for (const [items, count] of levelData.L) {
            supportLookup.set(items.slice().sort().join('|||'), count);
        }
    }

    for (const levelData of allLevels) {
        if (levelData.level < 2) continue;

        for (const [itemset, itemsetSupport] of levelData.L) {
            const items = Array.isArray(itemset) ? itemset : [itemset];
            const rules = generateRulesFromItemset(items, itemsetSupport, supportLookup, totalTransactions);
            allRules.push(...rules);
        }
    }

    return allRules;
}

// Generate Possible Rules From Specific Itemset
function generateRulesFromItemset(itemset, itemsetSupport, supportLookup, totalTransactions) {
    const rules = [];
    const n = itemset.length;

    for (let i = 1; i < Math.pow(2, n) - 1; i++) {
        const fPart = [];
        const sPart = [];

        for (let j = 0; j < n; j++) {
            if ((i & (1 << j)) !== 0) fPart.push(itemset[j]);
            else sPart.push(itemset[j]);
        }

        const fPartSupport = supportLookup.get(fPart.slice().sort().join('|||')) || 0;
        if (fPartSupport > 0) {
            rules.push({
                fPart,
                sPart,
                support: itemsetSupport,
                supportRatio: itemsetSupport / totalTransactions,
                confidence: itemsetSupport / fPartSupport
            });
        }
    }

    return rules;
}

// Keep Only Strong Rules
function pruneStrongRules(allRules, minConfidence) {
    return allRules.filter(rule => rule.confidence >= minConfidence);
}

// Get Support Count For Specific Itemset
function calcSupport(itemset, allLevels) {
    const itemsetKey = itemset.slice().sort().join('|||');
    for (const levelData of allLevels) {
        for (const [items, support] of levelData.L) {
            if (items.slice().sort().join('|||') === itemsetKey) return support;
        }
    }
    return 0;
}

// Get Lift For Specific Rule
function calcLift(rule, allLevels, totalTransactions) {
    const sPartSupport = calcSupport(rule.sPart, allLevels);
    if (sPartSupport === 0 || totalTransactions === 0) return 0;
    return rule.confidence / (sPartSupport / totalTransactions);
}

// Convert FP-Tree To Table Rows
function getFPTreeRows(root) {
    const rows = [];

    function visitNodes(parentNode, depth) {
        const children = Array.from(parentNode.children.values())
            .sort((a, b) => String(a.item).localeCompare(String(b.item)));

        for (const node of children) {
            rows.push({
                'Tree Path': `${'　'.repeat(depth)}${depth > 0 ? '└─ ' : ''}${node.item}`,
                'Item': node.item,
                'Count': node.count,
                'Depth': depth + 1,
                'Parent': node.parent.item || 'Root'
            });
            visitNodes(node, depth + 1);
        }
    }

    visitNodes(root, 0);
    return rows;
}

// Convert Header Table To Table Rows
function getHeaderTableRows(headerTable) {
    const rows = [];
    for (const [item, data] of headerTable) {
        rows.push({ 'Item': item, 'Support Count': data.support });
    }
    return rows;
}

// ========== FP-Growth Visualization ========== //

// Display Frequent Itemset Levels
function displayAllLevels(allLevels) {
    const resultsSection = document.getElementById('resultsSection');
    const container = document.createElement('div');
    container.className = 'step-container';

    const titleEl = document.createElement('h3');
    titleEl.className = 'step-title';
    titleEl.textContent = 'Frequent Itemsets (L1, L2, ..., LK)';

    const content = document.createElement('div');
    content.className = 'step-content';

    for (const levelData of allLevels) {
        const heading = document.createElement('h4');
        heading.textContent = `L${levelData.level}`;
        content.appendChild(heading);

        const rows = [];
        for (const [items, count] of levelData.L) {
            rows.push({
                'Itemset': items.join(', '),
                'Support Count': count
            });
        }
        if (rows.length) content.appendChild(buildTable(rows));
    }

    if (allLevels.length === 0) content.innerHTML = '<p>No frequent itemsets found.</p>';
    container.appendChild(titleEl);
    container.appendChild(content);
    resultsSection.appendChild(container);
}

// Display All Association Rules
function displayAllAssRules(rules) {
    const tableData = rules.map(rule => ({
        'Rule': rule.fPart.join(', ') + ' → ' + rule.sPart.join(', '),
        'Support Count': rule.support,
        'Support': (rule.supportRatio * 100).toFixed(2) + '%',
        'Confidence': (rule.confidence * 100).toFixed(2) + '%'
    }));
    appendStep('Association Rules (All Candidates)', tableData, true);
}

// Display Only Strong Rules And Lift
function displayAssRules(rules, allLevels, totalTransactions) {
    const tableData = rules.map(rule => ({
        'Rule': rule.fPart.join(', ') + ' → ' + rule.sPart.join(', '),
        'Support': (rule.supportRatio * 100).toFixed(2) + '%',
        'Confidence': (rule.confidence * 100).toFixed(2) + '%',
        'Lift': calcLift(rule, allLevels, totalTransactions).toFixed(3)
    }));
    appendStep('Association Rules (Strong Rules)', tableData, true);
}
