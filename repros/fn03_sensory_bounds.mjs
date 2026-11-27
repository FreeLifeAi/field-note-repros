// SPDX-License-Identifier: Apache-2.0
// Field Note 03 Verifiers: Critical Slowing (tanh), 200-Surrogate Floor, and Clopper-Pearson False-Alarm Bounds

export function verifyTanhCriticalSlowing({ z0 = 0.5, tol = 1e-5, maxSteps = 5000 } = {}) {
  let z = z0;
  let zAt32 = null;
  let residualAt32 = null;
  let firstStepBelowTol = null;

  for (let k = 0; k < maxSteps; k++) {
    const next = Math.tanh(z);
    const residual = Math.abs(next - z);
    if (k === 32) {
      zAt32 = z;
      residualAt32 = residual;
    }
    if (firstStepBelowTol === null && residual < tol) {
      firstStepBelowTol = k;
      break;
    }
    z = next;
  }

  return {
    z0,
    zAt32: Number(zAt32.toFixed(6)),
    residualAt32: Number(residualAt32.toFixed(8)),
    firstIterationResidualBelow1e5: firstStepBelowTol
  };
}

// Exact Monte Carlo permutation p-value estimator: p_hat = (1 + count(T_surr >= T_obs)) / (B + 1)
export function permutationPValue(observedStat, surrogateStats) {
  const B = surrogateStats.length;
  const geCount = surrogateStats.filter(s => s >= observedStat).length;
  return {
    surrogateCount: B,
    totalEnsembleSize: B + 1,
    exceedances: geCount,
    pHat: Number(((1 + geCount) / (B + 1)).toFixed(4)),
    minimumPossiblePHat: Number((1 / (B + 1)).toFixed(4))
  };
}

// Exact one-sided (1 - alpha) Clopper-Pearson upper confidence bound when k = 0 alarms observed in N negative-control trials
export function zeroAlarmClopperPearsonUpperBound(numTrials, alpha = 0.05) {
  if (!Number.isInteger(numTrials) || numTrials <= 0) {
    throw new Error("numTrials must be a positive integer");
  }
  const upper = 1 - Math.pow(alpha, 1 / numTrials);
  return {
    observedAlarms: 0,
    negativeControlTrials: numTrials,
    confidenceLevel: 1 - alpha,
    upperBoundRate: Number(upper.toFixed(6))
  };
}

export function runZeroRetention16x16Summary(rawLuma256) {
  if (!(rawLuma256 instanceof Uint8Array) || rawLuma256.length !== 256) {
    throw new Error("Expected 16x16 Uint8Array (256 bytes)");
  }
  let sum = 0;
  let gradSum = 0;
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      const v = rawLuma256[r * 16 + c];
      sum += v;
      if (c < 15) gradSum += Math.abs(v - rawLuma256[r * 16 + c + 1]);
      if (r < 15) gradSum += Math.abs(v - rawLuma256[(r + 1) * 16 + c]);
    }
  }
  // Zero out transient input slice in-place after computing scalar summary
  rawLuma256.fill(0);
  return {
    meanLuma: Number((sum / 256 / 255).toFixed(4)),
    edgeFlux: Number((gradSum / (2 * 16 * 15 * 255)).toFixed(4)),
    inputZeroedAfterSummary: rawLuma256.every(b => b === 0)
  };
}
