// SPDX-License-Identifier: Apache-2.0
// Field Note 01 Synthetic Reproduction: Atomic SQLite CAS vs. Multi-Round Compaction Objection Loss

import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

export function sha256Hex(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function scoreObjectionPreservation(recordText, requiredObjectionTokens) {
  const lower = recordText.toLowerCase();
  const missing = requiredObjectionTokens.filter(tok => !lower.includes(tok.toLowerCase()));
  return {
    preserved: missing.length === 0,
    retainedCount: requiredObjectionTokens.length - missing.length,
    totalRequired: requiredObjectionTokens.length,
    missingTokens: missing
  };
}

export function runFieldNote01Repro() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE state_cells (
      cell_key TEXT PRIMARY KEY,
      rev INTEGER NOT NULL,
      parent_hash TEXT,
      state_hash TEXT NOT NULL,
      body_text TEXT NOT NULL,
      structured_open_objections_json TEXT NOT NULL
    );
    CREATE TABLE cas_conflicts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cell_key TEXT NOT NULL,
      attempted_rev INTEGER NOT NULL,
      actual_rev INTEGER NOT NULL,
      rejected_hash TEXT NOT NULL
    );
  `);

  const originalBody = [
    "Architecture checkpoint v1: Local sensor state bus transfers 16x16 luma summaries.",
    "Active unresolved objection [OBJ-07]: Reviewer B demonstrated that unpinned timestamp windows",
    "permit replay of stale calibration frames across daemon restarts; sign-off withheld pending monotonic epoch counter.",
    "Throughput nominal on synthetic bench."
  ].join(" ");

  const requiredTokens = ["OBJ-07", "monotonic epoch counter", "sign-off withheld"];
  const structuredObjections = [{ id: "OBJ-07", status: "open", summary: "Require monotonic epoch counter across restarts" }];

  const h1 = sha256Hex(originalBody);
  db.prepare(`INSERT INTO state_cells VALUES (?, 1, NULL, ?, ?, ?)`).run(
    "checkpoint-main",
    h1,
    originalBody,
    JSON.stringify(structuredObjections)
  );

  function casUpdate(cellKey, expectedRev, nextBody, nextObjections) {
    const nextHash = sha256Hex(nextBody);
    const cur = db.prepare(`SELECT rev, state_hash FROM state_cells WHERE cell_key = ?`).get(cellKey);
    const res = db.prepare(`
      UPDATE state_cells
      SET rev = rev + 1, parent_hash = ?, state_hash = ?, body_text = ?, structured_open_objections_json = ?
      WHERE cell_key = ? AND rev = ?
    `).run(cur.state_hash, nextHash, nextBody, JSON.stringify(nextObjections), cellKey, expectedRev);

    if (res.changes === 0) {
      db.prepare(`INSERT INTO cas_conflicts (cell_key, attempted_rev, actual_rev, rejected_hash) VALUES (?, ?, ?, ?)`).run(
        cellKey, expectedRev, cur.rev, nextHash
      );
      return { status: 409, code: "CAS_CONFLICT", actualRev: cur.rev };
    }
    return { status: 200, rev: expectedRev + 1, stateHash: nextHash };
  }

  // Simulated valid-parent ~2.2x prose compaction that smooths away the unresolved objection in prose
  const compactedProseOnly =
    "Architecture checkpoint v2: Local 16x16 luma summary bus operational with nominal bench throughput; calibration timing review noted.";
  const observedCompressionRatio = Number((originalBody.length / compactedProseOnly.length).toFixed(2));

  const winWrite = casUpdate("checkpoint-main", 1, compactedProseOnly, structuredObjections);
  const staleWrite = casUpdate("checkpoint-main", 1, "Stale concurrent worker overwrite", structuredObjections);

  const baselineProseScore = scoreObjectionPreservation(originalBody, requiredTokens);
  const compactedProseScore = scoreObjectionPreservation(compactedProseOnly, requiredTokens);
  const rowAfter = db.prepare(`SELECT * FROM state_cells WHERE cell_key = 'checkpoint-main'`).get();
  const structuredStillIntact = JSON.parse(rowAfter.structured_open_objections_json).some(o => o.id === "OBJ-07" && o.status === "open");

  db.close();
  return {
    syntheticFixture: true,
    casWinnerStatus: winWrite.status,
    casStaleWriterStatus: staleWrite.status,
    observedCompressionRatio,
    baselineProsePreservedObjection: baselineProseScore.preserved,
    compactedProsePreservedObjection: compactedProseScore.preserved,
    structuredFieldPreservedObjection: structuredStillIntact
  };
}
