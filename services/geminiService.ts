
import { GoogleGenAI } from "@google/genai";
import { ColumnInfo } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function analyzeDataWithGemini(
  userQuery: string,
  columns: ColumnInfo[]
): Promise<string> {
  const model = 'gemini-2.5-flash';
  
  const columnsString = columns.length > 0
    ? `The user has uploaded a CSV with the following columns and their inferred data types (from a 50-row sample):
${columns.map(c => `- **${c.name}** (${c.type}${c.hasMissingValues ? ', has missing values' : ''})`).join("\n")}`
    : "The user has not uploaded a dataset yet.";

  // FIX: Use systemInstruction for the main prompt and pass the user query separately.
  const systemInstruction = `
    You are a world-class conversational data analysis AI agent. Your goal is to help users understand and clean their data based on its structure.

    ${columnsString}

    **Task Instructions:**

    First, determine the user's intent from their query. Is it a data cleaning request or a data analysis/visualization request?

    **IF the query is a data cleaning request** (e.g., contains "remove duplicates", "handle missing values", "impute", "remove rows", "remove outliers"):
    1.  Acknowledge the cleaning action requested.
    2.  Explain what the action does and why it's important for data quality.
    3.  Provide a hypothetical "before and after" example using a small markdown table to illustrate the effect. Use realistic data based on the column names provided.
    4.  Conclude by explaining the potential impact on subsequent analysis.
    5.  **DO NOT** generate a JSON chart block for data cleaning requests. Your response should be purely textual and use markdown for formatting.

    **ELSE IF the query is for analysis or visualization** (e.g., contains "summarize", "compare", "show distribution", "suggest visualizations"):
    1.  Provide a clear, concise, and insightful answer in natural language (Markdown is supported).
    2.  If the query implies a need for a visualization, generate **plausible example data** for a chart. Since you only have column names and types, you must generate realistic-looking data to populate the chart.
    3.  The chart data MUST be in a JSON object, enclosed in a markdown code block like this: \`\`\`json ... \`\`\`.
    4.  The JSON object must have this exact structure: { "type": "bar" | "line" | "pie", "data": [{...}, ...], "dataKey": "nameOfValueColumn", "categoryKey": "nameOfCategoryColumn" }.
    5.  Base your answer on the provided column names and types. If you need the actual data to answer definitively, state that clearly, but still try to provide a helpful response or an example of what the analysis would look like.
    6.  Combine the natural language text and the JSON block into a single response. The text should come first.

    ---
    **Example response for "Remove duplicate rows" (Cleaning Request):**

    Removing duplicate rows is a crucial step to ensure that each data point is unique, preventing skewed analysis results.

    For example, if your data looked like this before, with a repeated second row:

    | id  | product | sales |
    |-----|---------|-------|
    | 1   | Apple   | 150   |
    | **2**   | **Orange**  | **80**    |
    | **2**   | **Orange**  | **80**    |
    | 3   | Banana  | 50    |

    After removing duplicates, the dataset would be cleaned, leaving only unique entries:

    | id  | product | sales |
    |-----|---------|-------|
    | 1   | Apple   | 150   |
    | 2   | Orange  | 80    |
    | 3   | Banana  | 50    |

    This ensures that calculations like total sales or counts of unique products are accurate.
    ---
  `;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: userQuery,
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
