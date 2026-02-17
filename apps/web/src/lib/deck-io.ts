import type { DeckResponse, FlashcardResponse } from "./deck-api";

export interface DeckExport {
  version: "1.0";
  deck: { name: string; description: string; tags: string[] };
  cards: Array<{
    front: string;
    back: string;
    tags: string[];
    difficulty: string;
  }>;
  exportedAt: string;
}

// --- Download helper ---

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Export functions ---

export function exportDeckAsJSON(
  deck: DeckResponse,
  cards: FlashcardResponse[]
) {
  const data: DeckExport = {
    version: "1.0",
    deck: {
      name: deck.name,
      description: deck.description,
      tags: deck.tags,
    },
    cards: cards.map((c) => ({
      front: c.front,
      back: c.back,
      tags: c.tags,
      difficulty: c.difficulty,
    })),
    exportedAt: new Date().toISOString(),
  };

  const json = JSON.stringify(data, null, 2);
  const safeName = deck.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  downloadFile(json, `${safeName}.json`, "application/json");
}

function escapeCSVField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportDeckAsCSV(
  deck: DeckResponse,
  cards: FlashcardResponse[]
) {
  const header = "front,back,tags,difficulty";
  const rows = cards.map(
    (c) =>
      `${escapeCSVField(c.front)},${escapeCSVField(c.back)},${escapeCSVField(c.tags.join(";"))},${c.difficulty}`
  );

  const csv = [header, ...rows].join("\n");
  const safeName = deck.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  downloadFile(csv, `${safeName}.csv`, "text/csv");
}

// --- Import functions ---

export function parseJSONImport(text: string): DeckExport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file");
  }

  const data = parsed as Record<string, unknown>;

  // Validate structure
  if (!data || typeof data !== "object") {
    throw new Error("Invalid file format");
  }

  // Support the DeckExport format (single deck)
  if (data.version === "1.0" && data.deck && Array.isArray(data.cards)) {
    const deck = data.deck as Record<string, unknown>;
    if (!deck.name || typeof deck.name !== "string") {
      throw new Error("Missing deck name");
    }
    const cards = data.cards as Array<Record<string, unknown>>;
    return {
      version: "1.0",
      deck: {
        name: String(deck.name),
        description: String(deck.description ?? ""),
        tags: Array.isArray(deck.tags)
          ? deck.tags.map(String)
          : [],
      },
      cards: cards.map(validateCard),
      exportedAt: String(data.exportedAt ?? new Date().toISOString()),
    };
  }

  // Support the legacy full-export format (multi-deck — take first deck)
  if (Array.isArray(data.decks) && data.decks.length > 0) {
    const first = data.decks[0] as Record<string, unknown>;
    const cards = Array.isArray(first.cards)
      ? (first.cards as Array<Record<string, unknown>>)
      : [];
    return {
      version: "1.0",
      deck: {
        name: String(first.name ?? "Imported Deck"),
        description: String(first.description ?? ""),
        tags: Array.isArray(first.tags) ? first.tags.map(String) : [],
      },
      cards: cards.map(validateCard),
      exportedAt: String(data.exportedAt ?? new Date().toISOString()),
    };
  }

  throw new Error(
    "Unrecognized file format. Expected a Flashcard App export file."
  );
}

function validateCard(raw: Record<string, unknown>) {
  const front = String(raw.front ?? "").trim();
  const back = String(raw.back ?? "").trim();
  if (!front || !back) {
    throw new Error("Each card must have a front and back side");
  }

  const difficulty = String(raw.difficulty ?? "medium");
  const validDifficulties = ["easy", "medium", "hard"];

  return {
    front,
    back,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    difficulty: validDifficulties.includes(difficulty) ? difficulty : "medium",
  };
}

export function parseCSVImport(
  text: string
): Array<{ front: string; back: string; tags: string[]; difficulty: string }> {
  const lines = parseCSVLines(text);
  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Check if first row is a header
  const firstRow = lines[0]!;
  const isHeader =
    firstRow.length >= 2 &&
    firstRow[0]!.toLowerCase() === "front" &&
    firstRow[1]!.toLowerCase() === "back";

  const dataRows = isHeader ? lines.slice(1) : lines;

  if (dataRows.length === 0) {
    throw new Error("No card data found in CSV");
  }

  return dataRows
    .filter((row) => row.length >= 2 && row[0]!.trim() && row[1]!.trim())
    .map((row) => {
      const tagsStr = row[2]?.trim() ?? "";
      const difficulty = row[3]?.trim() ?? "medium";
      const validDifficulties = ["easy", "medium", "hard"];

      return {
        front: row[0]!.trim(),
        back: row[1]!.trim(),
        tags: tagsStr ? tagsStr.split(";").map((t) => t.trim()).filter(Boolean) : [],
        difficulty: validDifficulties.includes(difficulty) ? difficulty : "medium",
      };
    });
}

function parseCSVLines(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i]!;

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        current.push(field);
        field = "";
        i++;
      } else if (ch === "\n" || ch === "\r") {
        current.push(field);
        field = "";
        if (current.some((f) => f.trim())) {
          rows.push(current);
        }
        current = [];
        if (ch === "\r" && i + 1 < text.length && text[i + 1] === "\n") {
          i += 2;
        } else {
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Last field/row
  current.push(field);
  if (current.some((f) => f.trim())) {
    rows.push(current);
  }

  return rows;
}
