export type Sentiment = "positive" | "neutral" | "negative";

export type Theme = {
  label: string;
  weight: number;
  group: "design" | "engineering" | "marketing" | "operations" | "strategy";
};

export type WorkIQContext = {
  participants: string[];
  deadlines: string[];
  topics: string[];
};

export type ConceptLink = {
  source: string;
  target: string;
  label: string;
};

export type FoundryIQCitation = {
  title: string;
  source: string;
  snippet: string;
};

export type FoundryIQContext = {
  answer: string;
  citations: FoundryIQCitation[];
};

export type AnalysisResult = {
  id?: string;
  title?: string;
  createdAt?: string;
  sourceType?: "text" | "file" | "audio";
  summary: string;
  sentiment: Sentiment;
  sentimentScore: number;
  keywords: string[];
  themes: Theme[];
  semanticClusters?: Record<string, string[]>;
  workIQ: WorkIQContext;
  fabricIQGroups: Record<string, string[]>;
  foundryIQ?: FoundryIQContext;
  conceptLinks: ConceptLink[];
  palette: string[];
  embeddings?: {
    model: string;
    dimensions: number;
    preview: number[];
  };
  backgroundImageUrl?: string;
  annotations?: string[];
  votes?: Record<string, number>;
};

export type BoardRecord = Required<Pick<AnalysisResult, "id" | "title" | "createdAt">> & {
  sourceType: NonNullable<AnalysisResult["sourceType"]>;
  summary: string;
  sentiment: Sentiment;
  sentimentScore: number;
  topics: string[];
  analysis: AnalysisResult;
};
