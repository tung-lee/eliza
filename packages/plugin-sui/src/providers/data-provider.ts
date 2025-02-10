import { BaseProvider } from "@/types";
import { data } from "@/data";

export class DataProvider implements BaseProvider {
  constructor() {}

  async getRelevantData(query: string): Promise<string> {
    const result = data.join('\n');
    console.log('DataProvider - Query:', query);
    console.log('DataProvider - Returning data length:', result.length);
    return result;
  }
} 