import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, analyzeCsvData } from '../src/features/data-analysis/csv-analyzer';

test('CSV Analyzer — parseCsv parses RFC-compliant quoted CSV with newlines & commas', () => {
  const csvContent = `Name,Role,Salary,Description\n"Alice, Eng",Lead,145000,"Architects core distributed engine"\nBob,Analyst,95000,"Data analysis & reporting"\nCharlie,Security,130000,"Threat modeling"`;

  const parsed = parseCsv(csvContent);
  assert.equal(parsed.headers.length, 4);
  assert.deepEqual(parsed.headers, ['Name', 'Role', 'Salary', 'Description']);
  assert.equal(parsed.rows.length, 3);
  assert.equal(parsed.rows[0][0], 'Alice, Eng');
  assert.equal(parsed.rows[0][2], '145000');
});

test('CSV Analyzer — Phase 5 Acceptance Fixture (Product & Sales)', () => {
  const fixture = `product,sales\nPen,10\nBook,20\nPen,15`;

  const result = analyzeCsvData('product_sales.csv', fixture);

  // 1. Total data rows: 3, excluding the header
  assert.equal(result.rowCount, 3);

  // 2. Total sales: 45
  const salesCol = result.columns.find(c => c.name.toLowerCase() === 'sales');
  assert.ok(salesCol, 'Sales column must be discovered');
  assert.equal(salesCol.sum, 45, 'Total sales must equal 45');

  // 3. Pen sales: 25 & Book sales: 20
  const productSalesMap = result.groupAggregations?.['sales_by_product'];
  assert.ok(productSalesMap, 'Group aggregation sales_by_product must be computed');
  assert.equal(productSalesMap['Pen'], 25, 'Pen sales must equal 25');
  assert.equal(productSalesMap['Book'], 20, 'Book sales must equal 20');

  // Check generated markdown contains the totals
  assert.ok(result.generatedSummaryMarkdown.includes('Pen'));
  assert.ok(result.generatedSummaryMarkdown.includes('25'));
  assert.ok(result.generatedSummaryMarkdown.includes('45'));
});

test('CSV Analyzer — Handles edge cases: empty files, headers only, and missing columns', () => {
  // Empty file throws error
  assert.throws(() => parseCsv(''), /CSV file is empty/);
  assert.throws(() => parseCsv('   \n\r\n  '), /CSV file is empty/);

  // Header only throws error
  assert.throws(() => analyzeCsvData('empty.csv', 'col1,col2,col3'), /contains no data rows/);

  // Missing values and mixed types are handled gracefully without crashing
  const mixedCsv = `id,name,value\n1,Alpha,100\n2,Beta,N/A\n3,Gamma,null\n4,Delta,400`;
  const result = analyzeCsvData('mixed.csv', mixedCsv);
  assert.equal(result.rowCount, 4);
  const valueCol = result.columns.find(c => c.name === 'value');
  assert.ok(valueCol);
  assert.equal(valueCol.nullCount, 2);
  assert.equal(valueCol.min, 100);
  assert.equal(valueCol.max, 400);
  assert.equal(valueCol.sum, 500);
});

test('CSV Analyzer — analyzeCsvData produces descriptive statistics and markdown summary', () => {
  const csvContent = `Metric,Month,Value,Category\nMRR,Jan,100,SaaS\nMRR,Feb,105,SaaS\nMRR,Mar,102,SaaS\nMRR,Apr,98,SaaS\nMRR,May,104,SaaS\nMRR,Jun,101,SaaS\nMRR,Jul,5000,SaaS`; // 5000 is an anomaly

  const result = analyzeCsvData('q1_mrr_trends.csv', csvContent);
  assert.equal(result.fileName, 'q1_mrr_trends.csv');
  assert.equal(result.rowCount, 7);

  const valueCol = result.columns.find(c => c.name === 'Value');
  assert.ok(valueCol);
  assert.equal(valueCol.type, 'numeric');
  assert.ok(valueCol.mean && valueCol.mean > 0);
  assert.ok(valueCol.median && valueCol.median > 0);

  // Anomaly check on outlier
  assert.ok(result.anomalies.length > 0);
  assert.ok(result.generatedSummaryMarkdown.includes('Deterministic Data Analysis'));
});
