export type ProfileEnv = Record<string, string>;

export interface Profile {
  id: string;
  name: string;
  command: string;
  args: string[];
  env: ProfileEnv;
}

export interface ConfigFile {
  version: number;
  profiles: Profile[];
  lastUsedProfileId?: string;
  globalEnv: ProfileEnv;
}

export interface PromptProfileInput {
  name: string;
  anthropicAuthToken?: string;
  anthropicBaseUrl?: string;
  anthropicModel?: string;
  anthropicDefaultHaikuModel?: string;
  anthropicDefaultSonnetModel?: string;
  anthropicDefaultOpusModel?: string;
  claudeCodeSubagentModel?: string;
  extraEnv: ProfileEnv;
}
