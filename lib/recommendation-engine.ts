export type CentreCongestion = {
  centreId: string;
  name: string;
  distanceKm: number;
  activeQueueCount: number;
  estimatedWaitMinutes: number;
  baysAvailable: number;
  processingSpeedPerQtlMin: number;
};

export type SlotCongestion = {
  slotId: string;
  shortTime: string;
  timeWindow: string;
  bookedCount: number;
  maxCapacity: number;
  utilizationRate: number; // 0 to 1
};

export type SmartRecommendationResult = {
  recommendedCentre: {
    centreId: string;
    name: string;
    distance: string;
    distanceKm: number;
    waitMinutes: number;
    estimatedWaitMinutes?: number;
    activeQueueCount: number;
    baysAvailable?: number;
    score?: number;
    reason: string;
  };
  bestCentre: {
    centreId: string;
    name: string;
    distance: string;
    distanceKm: number;
    waitMinutes: number;
    estimatedWaitMinutes: number;
    activeQueueCount: number;
    baysAvailable: number;
    score: number;
    reason: string;
  };
  optimalSlot: {
    slotId: string;
    shortTime: string;
    timeWindow: string;
    availableCapacity: number;
    availableSeats?: number;
    utilizationRate?: number;
    reason: string;
  };
  recommendedSlot: {
    slotId: string;
    shortTime: string;
    timeWindow: string;
    availableCapacity: number;
    availableSeats: number;
    utilizationRate: number;
    reason: string;
  };
  timeSavedMinutes: number;
  reasoning: string;
  departureAdvisor: {
    suggestedDepartureTime: string;
    estimatedTravelMinutes: number;
    advice: string;
  };
  allCentresScored: Array<{
    centreId: string;
    name: string;
    distanceKm: number;
    waitMinutes: number;
    score: number;
    recommended: boolean;
  }>;
};

/**
 * Multi-Factor Scoring Engine:
 * Evaluates Distance, Current Wait Time, and Slot Utilization.
 * Lower Score = Higher Recommendation.
 */
export function calculateBestCentreAndSlot(
  centres: CentreCongestion[],
  slots: SlotCongestion[],
  preferredSlotTime?: string
): SmartRecommendationResult {
  if (centres.length === 0) {
    throw new Error("No procurement centres available for recommendation");
  }

  // Weightings
  const W_DISTANCE = 0.35;
  const W_WAIT = 0.45;
  const W_QUEUE = 0.20;

  // Max values for normalization
  const maxDistance = Math.max(...centres.map((c) => c.distanceKm), 10);
  const maxWait = Math.max(...centres.map((c) => c.estimatedWaitMinutes), 60);
  const maxQueue = Math.max(...centres.map((c) => c.activeQueueCount), 10);

  const scoredCentres = centres.map((centre) => {
    const distNorm = centre.distanceKm / maxDistance;
    const waitNorm = centre.estimatedWaitMinutes / maxWait;
    const queueNorm = centre.activeQueueCount / maxQueue;

    const score =
      W_DISTANCE * distNorm +
      W_WAIT * waitNorm +
      W_QUEUE * queueNorm;

    return {
      ...centre,
      score: Number(score.toFixed(3)),
    };
  });

  // Sort ascending (lowest score is best)
  scoredCentres.sort((a, b) => a.score - b.score);
  const bestCentre = scoredCentres[0];

  // Evaluate optimal slot
  let optimalSlot = slots[0];
  if (slots.length > 0) {
    if (preferredSlotTime) {
      const preferred = slots.find((s) => s.shortTime === preferredSlotTime);
      if (preferred && preferred.utilizationRate < 0.85) {
        optimalSlot = preferred;
      } else {
        optimalSlot = [...slots].sort((a, b) => a.utilizationRate - b.utilizationRate)[0];
      }
    } else {
      optimalSlot = [...slots].sort((a, b) => a.utilizationRate - b.utilizationRate)[0];
    }
  }

  // Travel time estimate: tractor/truck speed ~25 km/h
  const travelMinutes = Math.max(10, Math.round((bestCentre.distanceKm / 25) * 60));
  const advice = `Travel time is approx ${travelMinutes} mins. Leave ${travelMinutes + 15} minutes before your slot to complete gate reporting on time.`;

  const secondBest = scoredCentres[1];
  const timeSavedMinutes = secondBest
    ? Math.max(0, secondBest.estimatedWaitMinutes - bestCentre.estimatedWaitMinutes)
    : 0;

  const reasoning = `Recommended ${bestCentre.name} due to faster clearance (~${bestCentre.estimatedWaitMinutes}m wait vs ~${secondBest?.estimatedWaitMinutes ?? 90}m) with ${bestCentre.baysAvailable ?? 6} operational bays.`;

  const bestCentreObj = {
    centreId: bestCentre.centreId,
    name: bestCentre.name,
    distance: `${bestCentre.distanceKm.toFixed(1)} km away`,
    distanceKm: bestCentre.distanceKm,
    waitMinutes: bestCentre.estimatedWaitMinutes,
    estimatedWaitMinutes: bestCentre.estimatedWaitMinutes,
    activeQueueCount: bestCentre.activeQueueCount,
    baysAvailable: bestCentre.baysAvailable ?? 6,
    score: bestCentre.score,
    reason: `Least crowded centre with only ${bestCentre.estimatedWaitMinutes} min wait and ${bestCentre.activeQueueCount} farmers currently waiting.`,
  };

  const slotObj = {
    slotId: optimalSlot?.slotId ?? "default",
    shortTime: optimalSlot?.shortTime ?? "10:30 AM",
    timeWindow: optimalSlot?.timeWindow ?? "10:30 AM – 11:00 AM",
    availableCapacity: Math.max(0, (optimalSlot?.maxCapacity ?? 15) - (optimalSlot?.bookedCount ?? 0)),
    availableSeats: Math.max(0, (optimalSlot?.maxCapacity ?? 15) - (optimalSlot?.bookedCount ?? 0)),
    utilizationRate: optimalSlot?.utilizationRate ?? 0.2,
    reason: `Low congestion window with ${Math.max(0, (optimalSlot?.maxCapacity ?? 15) - (optimalSlot?.bookedCount ?? 0))} bays currently open.`,
  };

  return {
    recommendedCentre: bestCentreObj,
    bestCentre: bestCentreObj,
    optimalSlot: slotObj,
    recommendedSlot: slotObj,
    timeSavedMinutes,
    reasoning,
    departureAdvisor: {
      suggestedDepartureTime: "15-20 min before slot",
      estimatedTravelMinutes: travelMinutes,
      advice,
    },
    allCentresScored: scoredCentres.map((c) => ({
      centreId: c.centreId,
      name: c.name,
      distanceKm: c.distanceKm,
      waitMinutes: c.estimatedWaitMinutes,
      score: c.score,
      recommended: c.centreId === bestCentre.centreId,
    })),
  };
}
