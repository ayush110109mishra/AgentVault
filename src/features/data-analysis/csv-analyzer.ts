import { CsvAnalysisResult, CsvColumnSummary } from '../../domain/types';

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      currentLine += '"';
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      if (currentLine.trim().length > 0) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    throw new Error('CSV file is empty.');
  }

  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let cell = '';
    let insideQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const next = line[i + 1];
      if (c === '"') {
        if (insideQuotes && next === '"') {
          cell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (c === ',' && !insideQuotes) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const headers = parseRow(lines[0]);
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    // Allow minor row padding/trimming
    if (row.length === headers.length) {
      rows.push(row);
    } else if (row.length > 0 && row.some(c => c !== '')) {
      // pad with empty strings if slight mismatch
      while (row.length < headers.length) row.push('');
      rows.push(row.slice(0, headers.length));
    }
  }

  return { headers, rows };
}

export function analyzeCsvData(fileName: string, text: string): CsvAnalysisResult {
  const { headers, rows } = parseCsv(text);

  if (rows.length === 0) {
    throw new Error('CSV has header but contains no data rows.');
  }

  const columns: CsvColumnSummary[] = [];
  const anomalies: { column: string; rowIndices: number[]; reason: string; value: any }[] = [];

  for (let colIdx = 0; colIdx < headers.length; colIdx++) {
    const colName = headers[colIdx];
    const rawValues = rows.map(r => r[colIdx]);

    let nullCount = 0;
    const numericVals: number[] = [];
    const nonNullVals: string[] = [];

    for (let rowIdx = 0; rowIdx < rawValues.length; rowIdx++) {
      const val = rawValues[rowIdx];
      if (val === undefined || val === null || val === '' || val.toLowerCase() === 'null' || val.toLowerCase() === 'na' || val.toLowerCase() === 'n/a') {
        nullCount++;
      } else {
        nonNullVals.push(val);
        const cleaned = val.replace(/[$,]/g, '');
        const num = parseFloat(cleaned);
        if (!isNaN(num) && isFinite(num)) {
          numericVals.push(num);
        }
      }
    }

    const uniqueCount = new Set(nonNullVals).size;
    const isNumeric = numericVals.length > 0 && (numericVals.length / (nonNullVals.length || 1)) >= 0.8;

    if (isNumeric && numericVals.length > 0) {
      const sorted = [...numericVals].sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const sum = sorted.reduce((acc, v) => acc + v, 0);
      const mean = sum / sorted.length;
      
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

      const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / sorted.length;
      const stdDev = Math.sqrt(variance);

      // Check for statistical anomalies (values > 2.5 standard deviations from mean)
      const anomalyRowIndices: number[] = [];
      if (stdDev > 0 && sorted.length >= 4) {
        for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          const raw = rows[rIdx][colIdx]?.replace(/[$,]/g, '');
          const val = parseFloat(raw);
          if (!isNaN(val) && Math.abs(val - mean) > 2.0 * stdDev) {
            anomalyRowIndices.push(rIdx + 2); // 1-indexed including header
          }
        }
      }

      if (anomalyRowIndices.length > 0) {
        anomalies.push({
          column: colName,
          rowIndices: anomalyRowIndices,
          reason: `Values deviate by more than 2.5σ from column mean (μ=${mean.toFixed(2)}, σ=${stdDev.toFixed(2)})`,
          value: anomalyRowIndices.length === 1 ? '1 outlier' : `${anomalyRowIndices.length} outliers`
        });
      }

      columns.push({
        name: colName,
        type: 'numeric',
        nullCount,
        uniqueCount,
        min: Number(min.toFixed(2)),
        max: Number(max.toFixed(2)),
        mean: Number(mean.toFixed(2)),
        median: Number(median.toFixed(2)),
        stdDev: Number(stdDev.toFixed(2)),
        sum: Number(sum.toFixed(2)),
        sampleValues: sorted.slice(0, 5)
      });
    } else {
      columns.push({
        name: colName,
        type: 'string',
        nullCount,
        uniqueCount,
        sampleValues: nonNullVals.slice(0, 5)
      });
    }
  }

  // Calculate categorical group breakdowns (e.g. Sales by Product)
  const groupAggregations: Record<string, Record<string, number>> = {};
  const stringCols = columns.filter(c => c.type === 'string');
  const numericColSummaries = columns.filter(c => c.type === 'numeric');

  for (const sCol of stringCols) {
    const sColIdx = headers.indexOf(sCol.name);
    for (const nCol of numericColSummaries) {
      const nColIdx = headers.indexOf(nCol.name);
      const aggKey = `${nCol.name.toLowerCase()}_by_${sCol.name.toLowerCase()}`;
      const groupSums: Record<string, number> = {};

      for (let r = 0; r < rows.length; r++) {
        const cat = rows[r][sColIdx];
        const valRaw = rows[r][nColIdx]?.replace(/[$,]/g, '');
        const val = parseFloat(valRaw);
        if (cat && !isNaN(val)) {
          groupSums[cat] = Number(((groupSums[cat] || 0) + val).toFixed(2));
        }
      }
      groupAggregations[aggKey] = groupSums;
    }
  }

  // Generate markdown report
  const summaryMarkdown = `# Deterministic Data Analysis: ${fileName}

**Dataset Overview:**
- Total Records: ${rows.length} rows
- Discovered Columns: ${headers.length} attributes
- Missing Cells Identified: ${columns.reduce((a, c) => a + c.nullCount, 0)}

## Column Metrics & Distributions
| Column | Type | Null Count | Unique Count | Range [Min - Max] | Mean (μ) | Median | Std Dev (σ) | Total Sum |
|---|---|---|---|---|---|---|---|---|
${columns.map(c => {
  if (c.type === 'numeric') {
    return `| **${c.name}** | \`numeric\` | ${c.nullCount} | ${c.uniqueCount} | [${c.min} .. ${c.max}] | ${c.mean} | ${c.median} | ${c.stdDev} | ${c.sum} |`;
  }
  return `| **${c.name}** | \`categorical\` | ${c.nullCount} | ${c.uniqueCount} | - | - | - | - | - |`;
}).join('\n')}

${Object.keys(groupAggregations).length > 0 ? `## Categorical Aggregations & Group Sums\n${Object.entries(groupAggregations).map(([key, map]) => {
  const items = Object.entries(map).map(([k, v]) => `  - **${k}**: ${v}`).join('\n');
  return `- **${key.replace(/_/g, ' ').toUpperCase()}**:\n${items}`;
}).join('\n')}\n` : ''}
## Anomaly & Risk Flags
${anomalies.length > 0 
  ? anomalies.map(a => `- **Column [${a.column}]**: ${a.reason} on CSV row(s): ${a.rowIndices.join(', ')}`).join('\n')
  : '- No significant statistical outliers (> 2.0σ) detected.'}

*Computed via AgentVault X local deterministic statistical engine. No raw data sent to unverified external endpoints.*
`;

  return {
    fileName,
    rowCount: rows.length,
    columnCount: headers.length,
    columns,
    anomalies,
    groupAggregations,
    generatedSummaryMarkdown: summaryMarkdown,
    parsedAt: Date.now()
  };
}

export const SAMPLE_CSV_DATA = `Month,ProductCategory,ActiveLeads,DealsClosed,RevenueUSD,CustomerAcquisitionCostUSD,ChurnRatePercent
2026-01,Enterprise AI,450,42,126000,420,1.2
2026-02,Enterprise AI,520,51,153000,410,1.1
2026-03,Enterprise AI,610,64,192000,395,0.9
2026-04,Enterprise AI,590,58,174000,405,1.0
2026-05,Enterprise AI,680,72,216000,380,0.8
2026-06,Enterprise AI,740,81,243000,370,0.9
2026-07,Enterprise AI,810,95,285000,360,0.7
2026-08,Enterprise AI,860,102,306000,355,0.8
2026-09,Enterprise AI,910,115,345000,340,0.7
2026-01,Developer Tools,850,92,64400,120,2.4
2026-02,Developer Tools,910,105,73500,115,2.1
2026-03,Developer Tools,990,118,82600,110,2.0
2026-04,Developer Tools,1050,126,88200,108,1.9
2026-05,Developer Tools,1120,138,96600,105,1.8
2026-06,Developer Tools,1200,149,104300,102,1.7
2026-07,Developer Tools,1280,162,113400,98,1.6
2026-08,Developer Tools,1350,175,122500,95,1.5
2026-09,Developer Tools,1420,188,131600,92,1.4
2026-01,Security Compliance,210,18,90000,650,0.5
2026-02,Security Compliance,230,22,110000,640,0.4
2026-03,Security Compliance,250,25,125000,630,0.4
2026-04,Security Compliance,270,29,145000,610,0.3
2026-05,Security Compliance,290,32,160000,600,0.4
2026-06,Security Compliance,310,36,180000,590,0.3
2026-07,Security Compliance,340,41,205000,570,0.3
2026-08,Security Compliance,380,47,235000,550,0.2
2026-09,Security Compliance,420,53,265000,530,0.3
2026-09,Experimental Lab,95,6,980000,4800,8.5`;
