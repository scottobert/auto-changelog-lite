export interface Config {
  summarize?: boolean;
  openAiApiKey?: string;
  customPrompt?: string;
  conventionalCommits?: ConventionalCommitsConfig;
}

export interface ConventionalCommitsConfig {
  enabled?: boolean;
  types?: string[];
}
