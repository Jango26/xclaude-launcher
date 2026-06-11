import type { ConfigFile, Profile, PromptProfileInput } from '../models/config.js';
import { FileConfigRepository } from '../adapters/file-config-repo.js';
import { buildProfileEnv } from '../utils/env.js';
import { CliError } from '../utils/errors.js';

export class ConfigService {
  constructor(private readonly repository = new FileConfigRepository()) {}

  async getConfig(): Promise<ConfigFile> {
    return this.repository.load();
  }

  async listProfiles(): Promise<Profile[]> {
    const config = await this.repository.load();
    return config.profiles;
  }

  sortProfilesByLastUsed(profiles: Profile[], lastUsedProfileId?: string): Profile[] {
    if (!lastUsedProfileId) {
      return [...profiles];
    }

    const sortedProfiles = [...profiles];
    const index = sortedProfiles.findIndex((profile) => profile.id === lastUsedProfileId);
    if (index <= 0) {
      return sortedProfiles;
    }

    const [lastUsedProfile] = sortedProfiles.splice(index, 1);
    sortedProfiles.unshift(lastUsedProfile);
    return sortedProfiles;
  }

  async getProfileByIdOrName(idOrName: string): Promise<Profile> {
    const config = await this.repository.load();
    const profile = config.profiles.find((item) => item.id === idOrName || item.name === idOrName);

    if (!profile) {
      throw new CliError(`Profile not found: ${idOrName}`);
    }

    return profile;
  }

  async addProfile(input: PromptProfileInput): Promise<Profile> {
    const config = await this.repository.load();
    const id = this.createProfileId(input.name);

    if (config.profiles.some((profile) => profile.id === id || profile.name === input.name)) {
      throw new CliError(`Profile already exists: ${input.name}`);
    }

    const profile: Profile = {
      id,
      name: input.name,
      command: 'claude',
      args: [],
      env: buildProfileEnv(input),
    };

    config.profiles.push(profile);
    await this.repository.save(config);
    return profile;
  }

  async updateProfile(profileId: string, input: PromptProfileInput): Promise<Profile> {
    const config = await this.repository.load();
    const profile = config.profiles.find((item) => item.id === profileId);

    if (!profile) {
      throw new CliError(`Profile not found: ${profileId}`);
    }

    const nextId = this.createProfileId(input.name);
    const duplicate = config.profiles.find(
      (item) => item.id !== profileId && (item.id === nextId || item.name === input.name),
    );

    if (duplicate) {
      throw new CliError(`Profile name conflict: ${input.name}`);
    }

    profile.id = nextId;
    profile.name = input.name;
    profile.env = buildProfileEnv(input);

    if (config.lastUsedProfileId === profileId) {
      config.lastUsedProfileId = nextId;
    }

    await this.repository.save(config);
    return profile;
  }

  async markLastUsed(profileId: string): Promise<void> {
    const config = await this.repository.load();
    config.lastUsedProfileId = profileId;
    await this.repository.save(config);
  }

  async removeProfile(profileId: string): Promise<Profile> {
    const config = await this.repository.load();
    const index = config.profiles.findIndex((item) => item.id === profileId);

    if (index === -1) {
      throw new CliError(`Profile not found: ${profileId}`);
    }

    const [removedProfile] = config.profiles.splice(index, 1);

    if (config.lastUsedProfileId === profileId) {
      config.lastUsedProfileId = config.profiles[0]?.id;
    }

    await this.repository.save(config);
    return removedProfile;
  }

  private createProfileId(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
