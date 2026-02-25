/**
 * Maps original IDs from a backup file to newly created IDs during restore.
 */
export class IdMapper {
  private map = new Map<string, string>();

  set(originalId: string, newId: string): void {
    this.map.set(originalId, newId);
  }

  get(originalId: string): string | undefined {
    return this.map.get(originalId);
  }

  require(originalId: string, label: string): string {
    const newId = this.map.get(originalId);
    if (!newId) {
      throw new Error(`Missing ID mapping for ${label}: ${originalId}`);
    }
    return newId;
  }
}

export interface MappedUser {
  originalId: string;
  originalEmail: string;
  originalName: string;
  resolvedId: string | null;
  resolvedName: string | null;
}

/**
 * Maps user references from backup to existing workspace members by email.
 * Unmatched users fall back to the admin's ID for required FKs, or null for optional FKs.
 */
export class UserMapper {
  private map = new Map<string, string | null>();
  private mappings: MappedUser[] = [];
  private fallbackUserId: string;

  constructor(fallbackUserId: string) {
    this.fallbackUserId = fallbackUserId;
  }

  addMapping(
    originalId: string,
    originalEmail: string,
    originalName: string,
    resolvedId: string | null,
    resolvedName: string | null,
  ): void {
    this.map.set(originalId, resolvedId);
    this.mappings.push({
      originalId,
      originalEmail,
      originalName,
      resolvedId,
      resolvedName,
    });
  }

  /** Returns the mapped user ID, falling back to the admin's ID for required FKs. */
  resolve(originalId: string): string {
    const resolved = this.map.get(originalId);
    return resolved ?? this.fallbackUserId;
  }

  /** Returns the mapped user ID or null (for optional FKs like assignees). */
  resolveOptional(originalId: string | null | undefined): string | null {
    if (!originalId) return null;
    const resolved = this.map.get(originalId);
    // If explicitly mapped to null (unmatched user), return null for optional FKs
    if (resolved === undefined) return null;
    return resolved;
  }

  getMappings(): MappedUser[] {
    return this.mappings;
  }

  getWarnings(): string[] {
    return this.mappings
      .filter((m) => !m.resolvedId)
      .map(
        (m) =>
          `User "${m.originalName}" (${m.originalEmail}) not found in workspace — references will use fallback or be skipped`,
      );
  }
}
