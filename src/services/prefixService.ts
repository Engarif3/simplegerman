import { apiClient } from "./apiClient";

export interface PrefixType {
  id: number;
  name: string;
}

export interface Prefix {
  id: number;
  prefixName: string;
  prefixWord: string;
  verb: boolean;
  meaning: string[];
  sentences: string[];
  prefixTypeId: number;
}

export interface PrefixTypeDetail extends PrefixType {
  prefixes: Prefix[];
}

class PrefixService {
  async getPrefixTypes(): Promise<PrefixType[]> {
    return apiClient.get<PrefixType[]>("/prefix/prefix-types");
  }

  async getPrefixType(prefixTypeId: number | string): Promise<PrefixTypeDetail> {
    return apiClient.get<PrefixTypeDetail>(`/prefix/prefix-type/${prefixTypeId}`);
  }
}

export const prefixService = new PrefixService();
