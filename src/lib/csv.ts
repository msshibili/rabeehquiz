import Papa from "papaparse";

export function generateCSV(data: Record<string, any>[]): string {
  return Papa.unparse(data);
}

export function parseCSV<T>(csvText: string): T[] {
  const result = Papa.parse<T>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  return result.data;
}
