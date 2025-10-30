import { GoogleGenAI } from "@google/genai";
import { ColumnInfo, NumericStats, CategoricalStats } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const formatColumnsForPrompt = (columns: ColumnInfo[]): string => {
  return columns.map(c => {
    let statsDetails = '';
    if (c.stats) {
        if (c.type === 'Numeric') {
            const stats = c.stats as NumericStats;
            statsDetails = `Mean=${stats.mean}, Median=${stats.median}, StdDev=${stats.stdDev}, Min=${stats.min}, Max=${stats.max}`;
        } else {
            const stats = c.stats as CategoricalStats;
            const topValues = Object.entries(stats.valueCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5) // Limit to top 5 for prompt brevity
                .map(([val, count]) => `'${val}' (${count})`)
                .join(', ');
            statsDetails = `Unique=${stats.uniqueValues}, Top Values: ${topValues}`;
        }
    }
    const missingInfo = c.hasMissingValues ? `, Missing=${c.missingCount}/${c.totalRows}` : '';
    return `- **${c.name}** (Type: ${c.type}${missingInfo}): ${statsDetails}`;
  }).join("\n");
};


export async function analyzeDataWithGemini(
  userQuery: string,
  columns: ColumnInfo[],
  csvData: string | null
): Promise<string> {
  const model = 'gemini-2.5-flash';
  
  const columnsString = columns.length > 0
    ? `The user has uploaded a CSV with the following columns and detailed analysis:
${formatColumnsForPrompt(columns)}`
    : "The user has not uploaded a dataset yet.";

  const systemInstruction = `
    You are a world-class conversational data analysis AI agent. Your goal is to help users understand, clean, and analyze their data.

    ${columnsString}

    **Task Instructions:**

    First, determine the user's intent from their query.

    **IF the query is a data cleaning or transformation request** (e.g., "remove duplicates", "handle missing values", "convert type", "remove outliers"):
    1.  Acknowledge the cleaning action requested.
    2.  Explain what the action does and why it's important for data quality.
    3.  Provide a hypothetical "before and after" example using a small markdown table to illustrate the effect.
    4.  After your textual explanation, you **MUST** return the **ENTIRE, MODIFIED** dataset enclosed in a CSV markdown block.
        The block must start with \`\`\`csv and end with \`\`\`.
        Example:
        \`\`\`csv
        header1,header2,header3
        valueA,valueB,valueC
        valueD,valueE,valueF
        \`\`\`
    5.  Do not include any other text after the CSV block. Your explanation must come first.

    **ELSE IF the query is for analysis or visualization** (e.g., "summarize", "compare", "show distribution"):
    1.  Provide a clear, concise, and insightful answer in natural language (Markdown is supported).
    2.  If the query implies a visualization, generate **plausible example data** for a chart based on the column structure.
    3.  The chart data MUST be in a JSON object, enclosed in a markdown code block: \`\`\`json ... \`\`\`.
    4.  **JSON Structure for Charts**:
        - The JSON object must have a \`type\` field: "bar", "line", "area", "scatter", or "pie".
        - It must have a \`data\` field: an array of objects.
        - **For "bar", "line", "area", and "pie" charts**, you must provide:
            - \`"categoryKey"\`: The name of the column for the category axis (X-axis for bar/line/area, labels for pie).
            - \`"dataKey"\`: The name of the column for the value axis (Y-axis for bar/line/area, values for pie).
            - Example: \`{ "type": "bar", "data": [...], "categoryKey": "Country", "dataKey": "Sales" }\`
        - **For "scatter" charts** (shows relationships between two numeric variables), you must provide:
            - \`"xKey"\`: The name of the column for the X-axis.
            - \`"yKey"\`: The name of the column for the Y-axis.
            - Example: \`{ "type": "scatter", "data": [...], "xKey": "Temperature", "yKey": "IceCreamSales" }\`
    5.  Combine the natural language text and the JSON block into a single response. The text should come first.
    6.  **DO NOT** return a CSV block for analysis queries unless the user explicitly asks for a modified dataset.
  `;

  const fullPrompt = csvData 
    ? `${userQuery}\n\nHere is the full dataset to perform the operation on:\n\`\`\`csv\n${csvData}\n\`\`\``
    : userQuery;


  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: fullPrompt,
        config: {
          systemInstruction: systemInstruction,
        },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get response from AI.");
  }
}