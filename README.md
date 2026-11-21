# FP-Growth Algorithm Implementation

A browser-based FP-Growth implementation built with native JavaScript, following the structure and coding style of the supplied Apriori project.

## Run

1. Extract the project folder.
2. Open `index.html` in a modern browser.
3. Upload an `.xlsx` or `.xls` transaction file.
4. Enter Minimum Support (%) and Minimum Confidence (%).
5. Click **Run FP-Growth Algorithm**.

The first worksheet is read. The first row is treated as a header; column 1 is the Transaction ID (TID), and column 2 contains comma-separated items.

## Features

- Reads transaction tables from Excel.
- Formats and cleans transactions, removing duplicate items within a transaction.
- Shows the horizontal transaction format.
- Builds and displays the FP-Tree and its header table.
- Mines all frequent itemsets, grouped as `L1`, `L2`, ..., `LK`.
- Generates association rules, filters strong rules by minimum confidence, and calculates lift.
- Allows different minimum support and confidence values on each run.

## Project Structure

```text
fp-growth-project/
├── css/
│   └── style.css
├── data/
│   ├── transactions.xlsx
│   └── transactions - Copy.xlsx
├── js/
│   ├── main.js                 # File handling, parameters, algorithm flow
│   ├── data_formatter.js       # Formatting and duplicate removal
│   ├── fpgrowth_functions.js   # FP-Tree, FP-Growth, rules and rendering
│   └── table_maker.js          # Shared HTML table and result sections
└── index.html
```

## Main Algorithm Methods

- `buildFPTree(finalTransactions, minSupportCount)`: builds the initial FP-Tree and header table.
- `insertTransaction(items, root, headerTable)`: inserts an ordered transaction into the tree.
- `getConditionalPatternBase(item, headerTable)`: extracts prefix paths for an item.
- `buildConditionalFPTree(conditionalPatternBase, minSupportCount)`: builds a conditional FP-Tree.
- `mineFPTree(headerTable, minSupportCount, suffix, frequentItemsets)`: recursively mines frequent patterns.
- `getAllFrequentItemSets(finalTransactions, minSupportCount)`: returns the FP-Tree, all frequent itemsets and levels `L1...LK`.
- `generateAllAssRules(allLevels, totalTransactions)`: generates association rules.
- `pruneStrongRules(allRules, minConfidence)`: keeps rules meeting minimum confidence.
- `calcLift(rule, allLevels, totalTransactions)`: calculates lift.

## Parameters

- `minSupport`: percentage entered by the user, converted to a ratio in `main.js`.
- `minSupportCount`: `minSupport * totalTransactions`.
- `minConfidence`: percentage entered by the user, converted to a ratio.
- `finalTransactions`: cleaned horizontal transaction records, each containing `tid` and `items`.

Support in the algorithm is stored as an occurrence count; the interface also displays support as a percentage for rules.
