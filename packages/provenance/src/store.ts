import Database from "better-sqlite3";
import { PostcodeAddress } from "./postcode.js";

export interface ProvenanceRecord {
  readonly postcode: string;
  readonly stage: string;
  readonly upstreamPostcodes: readonly string[];
  readonly content: string;
  readonly timestamp: number;
}

export class ProvenanceStore {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS provenance (
        postcode TEXT PRIMARY KEY,
        stage TEXT NOT NULL,
        upstream_postcodes TEXT NOT NULL DEFAULT '[]',
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS drift_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT NOT NULL,
        original TEXT NOT NULL,
        actual TEXT NOT NULL,
        severity TEXT NOT NULL CHECK(severity IN ('critical', 'major', 'minor')),
        timestamp INTEGER NOT NULL
      );
    `);
  }

  record(address: PostcodeAddress, upstreamPostcodes: readonly string[], content: string): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO provenance (postcode, stage, upstream_postcodes, content, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      address.raw,
      address.stage,
      JSON.stringify(upstreamPostcodes),
      content,
      Date.now()
    );
  }

  get(postcode: string): ProvenanceRecord | undefined {
    const row = this.db.prepare("SELECT * FROM provenance WHERE postcode = ?").get(postcode) as
      | { postcode: string; stage: string; upstream_postcodes: string; content: string; timestamp: number }
      | undefined;
    if (!row) return undefined;
    return {
      postcode: row.postcode,
      stage: row.stage,
      upstreamPostcodes: JSON.parse(row.upstream_postcodes) as string[],
      content: row.content,
      timestamp: row.timestamp,
    };
  }

  getChain(postcode: string): ProvenanceRecord[] {
    const chain: ProvenanceRecord[] = [];
    const visited = new Set<string>();
    const queue = [postcode];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const record = this.get(current);
      if (record) {
        chain.push(record);
        for (const upstream of record.upstreamPostcodes) {
          queue.push(upstream);
        }
      }
    }
    return chain;
  }

  isChainIntact(postcode: string): boolean {
    const chain = this.getChain(postcode);
    if (chain.length === 0) return false;
    for (const record of chain) {
      for (const upstream of record.upstreamPostcodes) {
        if (!this.get(upstream)) return false;
      }
    }
    return true;
  }

  logDrift(
    location: string,
    original: string,
    actual: string,
    severity: "critical" | "major" | "minor"
  ): void {
    this.db.prepare(`
      INSERT INTO drift_log (location, original, actual, severity, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(location, original, actual, severity, Date.now());
  }

  close(): void {
    this.db.close();
  }
}
