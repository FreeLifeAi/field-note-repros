#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { createServer } from "node:http";
import { runFieldNote01Repro } from "../repros/fn01_cas_and_drift.mjs";
import { runFieldNote02Harness, verifyPublishedFieldNote02Table } from "../repros/fn02_schema_order_2x2.mjs";
import {
  permutationPValue,
  runZeroRetention16x16Summary,
  verifyTanhCriticalSlowing,
  zeroAlarmClopperPearsonUpperBound
} from "../repros/fn03_sensory_bounds.mjs";

const fn01 = runFieldNote01Repro();
assert.equal(fn01.casWinnerStatus, 200);
assert.equal(fn01.casStaleWriterStatus, 409);
assert.equal(fn01.observedCompressionRatio, 2.52);
assert.equal(fn01.baselineProsePreservedObjection, true);
assert.equal(fn01.compactedProsePreservedObjection, false);
assert.equal(fn01.structuredFieldPreservedObjection, true);

const fn02 = verifyPublishedFieldNote02Table();
assert.equal(fn02.mode, "deterministic_synthetic_replay");
assert.deepEqual(fn02.choiceFirstBaseline, { trials: 4, factRecallPass: 4, correctActionPass: 0 });
assert.deepEqual(fn02.combinedOrderAndPaddingRepair, { trials: 3, factRecallPass: 3, correctActionPass: 3 });
assert.equal(fn02.schemaDigestsDistinct, true);
assert.equal(fn02.factorialConditionsCount, 4);

// Also verify optional LOCAL_LLM_URL runner against a loopback mock server (0 external network calls)
const mockSrv = createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const reqJson = JSON.parse(raw);
  const schemaProps = Object.keys(reqJson.response_format?.json_schema?.schema?.properties || {});
  const isChoiceFirst = schemaProps[0] === "choice";
  const replyObj = isChoiceFirst
    ? { choice: "PROCEED_DEPLOY", explanation: "SR-9 notes monotonic_epoch_verified is false." }
    : { governing_constraint: "SR-9 monotonic_epoch_verified=false", explanation: "Holding deploy.", choice: "HOLD_FOR_EPOCH_FIX" };
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(replyObj) } }] }));
});
await new Promise(r => mockSrv.listen(0, "127.0.0.1", r));
const mockPort = mockSrv.address().port;
let liveRunnerResult;
try {
  liveRunnerResult = await runFieldNote02Harness({ localLlmUrl: `http://127.0.0.1:${mockPort}` });
} finally {
  await new Promise(r => mockSrv.close(r));
}
assert.equal(liveRunnerResult.mode, "live_local_llm_endpoint");
assert.equal(liveRunnerResult.conditionResults.length, 4);
assert.equal(liveRunnerResult.conditionResults[0].score.recalledGoverningFact, true);
assert.equal(liveRunnerResult.conditionResults[0].score.selectedCorrectAction, false);
assert.equal(liveRunnerResult.conditionResults[3].score.selectedCorrectAction, true);

const slow = verifyTanhCriticalSlowing();
assert.equal(slow.zAt32, 0.197951);
assert.equal(slow.firstIterationResidualBelow1e5, 1547);

const posSurr = permutationPValue(10.44, Array.from({ length: 199 }, (_, i) => (i % 7) * 0.2));
assert.equal(posSurr.pHat, 0.005);
assert.equal(posSurr.minimumPossiblePHat, 0.005);

// Static-noise control example: 142 of 199 surrogates >= observed -> (1 + 142) / 200 = 0.7150
const negControlSurr = permutationPValue(0.35, Array.from({ length: 199 }, (_, i) => (i < 142 ? 0.5 : 0.1)));
assert.equal(negControlSurr.pHat, 0.715);

const cpBound = zeroAlarmClopperPearsonUpperBound(600, 0.05);
assert.equal(cpBound.observedAlarms, 0);
assert(cpBound.upperBoundRate > 0 && cpBound.upperBoundRate < 0.0051);

const buf = new Uint8Array(256);
for (let i = 0; i < 256; i++) buf[i] = (i * 7) & 0xff;
const summary = runZeroRetention16x16Summary(buf);
assert.equal(summary.inputZeroedAfterSummary, true);

console.log("FIELD_NOTE_REPROS_PASSED: All Field Note 01, 02, and 03 verifiers green", {
  fn01,
  fn02,
  liveMockConditionsVerified: liveRunnerResult.conditionResults.length,
  slow,
  posSurrFloor: posSurr.minimumPossiblePHat,
  negControlPHat: negControlSurr.pHat,
  cpUpper95For600Trials: cpBound.upperBoundRate
});
