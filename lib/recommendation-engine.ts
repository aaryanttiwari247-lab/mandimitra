import { normalizeCropName } from "./msp-rates";

export type CentreCongestion = {
  centreId: string;
  name: string;
  location?: string;
  isCrossDistrict?: boolean;
  distanceKm: number;
  activeQueueCount: number;
  estimatedWaitMinutes: number;
  baysAvailable: number;
  processingSpeedPerQtlMin: number;
  acceptedCrops?: string[];
  agencyType?: string;
};

export type SlotCongestion = {
  slotId: string;
  shortTime: string;
  timeWindow: string;
  bookedCount: number;
  maxCapacity: number;
  utilizationRate: number; // 0 to 1
  availableSeats?: number;
};

export type SmartRecommendationResult = {
  recommendedCentre: {
    centreId: string;
    name: string;
    distance: string;
    distanceKm: number;
    location?: string;
    isCrossDistrict?: boolean;
    isCompatible?: boolean;
    isFullyCompatible?: boolean;
    isNearest?: boolean;
    waitMinutes: number;
    estimatedWaitMinutes?: number;
    activeQueueCount: number;
    baysAvailable?: number;
    score?: number;
    reason: string;
    acceptedCrops?: string[];
    agencyType?: string;
  };
  bestCentre: {
    centreId: string;
    name: string;
    distance: string;
    distanceKm: number;
    location?: string;
    isCrossDistrict?: boolean;
    isCompatible?: boolean;
    isFullyCompatible?: boolean;
    isNearest?: boolean;
    waitMinutes: number;
    estimatedWaitMinutes: number;
    activeQueueCount: number;
    baysAvailable: number;
    score: number;
    reason: string;
    acceptedCrops?: string[];
    agencyType?: string;
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
  cropCompatibilitySummary?: {
    requestedCrops: string[];
    isFullyCompatible: boolean;
    acceptedByBestCentre: string[];
  };
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
    cropMatchRate: number;
  }>;
};

/**
 * Multi-Factor Scoring Engine:
 * Evaluates Crop Compatibility, Distance, Current Wait Time, and Slot Utilization.
 * Lower Score = Higher Recommendation.
 */
export function calculateBestCentreAndSlot(
  centres: CentreCongestion[],
  slots: SlotCongestion[],
  preferredSlotTime?: string,
  requestedCrops?: string[]
): SmartRecommendationResult {
  if (centres.length === 0) {
    throw new Error("No procurement centres available for recommendation");
  }

  // Weightings: Distance is given top priority (40%) to ensure nearest centre is favored
  const W_DISTANCE = 0.40;
  const W_WAIT = 0.35;
  const W_QUEUE = 0.15;
  const W_CROP = 0.10;

  // Max values for normalization
  const maxDistance = Math.max(...centres.map((c) => c.distanceKm), 10);
  const maxWait = Math.max(...centres.map((c) => c.estimatedWaitMinutes), 60);
  const maxQueue = Math.max(...centres.map((c) => c.activeQueueCount), 10);

  const cleanRequestedCrops = (requestedCrops || []).filter(Boolean);

  const scoredCentres = centres.map((centre) => {
    const distNorm = centre.distanceKm / maxDistance;
    const waitNorm = centre.estimatedWaitMinutes / maxWait;
    const queueNorm = centre.activeQueueCount / maxQueue;

    // Crop compatibility check
    let cropMatchRate = 1.0;
    let cropPenalty = 0.0;

    if (cleanRequestedCrops.length > 0 && centre.acceptedCrops && centre.acceptedCrops.length > 0) {
      const centreNormCrops = centre.acceptedCrops.map((c) => normalizeCropName(c));
      const acceptedCount = cleanRequestedCrops.filter((rc) =>
        centreNormCrops.includes(normalizeCropName(rc))
      ).length;

      cropMatchRate = acceptedCount / cleanRequestedCrops.length;

      if (cropMatchRate === 1.0) {
        cropPenalty = 0.0; // Perfect match
      } else if (cropMatchRate > 0) {
        cropPenalty = 0.50; // Partial match
      } else {
        cropPenalty = 1000.0; // Incompatible centre heavily disqualified
      }
    }

    const baseScore =
      W_DISTANCE * distNorm +
      W_WAIT * waitNorm +
      W_QUEUE * queueNorm +
      W_CROP * (1.0 - cropMatchRate);

    const totalScore = baseScore + cropPenalty;

    return {
      ...centre,
      cropMatchRate,
      score: Number(totalScore.toFixed(3)),
    };
  });

  // Group into fully compatible, partially compatible, and incompatible
  const fullyCompatible = scoredCentres.filter((c) => c.cropMatchRate === 1.0);
  const partiallyCompatible = scoredCentres.filter((c) => c.cropMatchRate > 0 && c.cropMatchRate < 1.0);

  // Eligible pool: STRICTLY prioritize compatible centres over incompatible ones.
  // An incompatible centre will NEVER be chosen if any compatible centre exists.
  let eligiblePool = fullyCompatible;
  if (eligiblePool.length === 0 && partiallyCompatible.length > 0) {
    eligiblePool = partiallyCompatible;
  }
  if (eligiblePool.length === 0) {
    eligiblePool = scoredCentres;
  }

  // Sort eligible candidates ascending by score
  eligiblePool.sort((a, b) => a.score - b.score);
  const bestCentre = eligiblePool[0];

  const isCompatible = cleanRequestedCrops.length === 0 || bestCentre.cropMatchRate > 0;
  const isFullyCompatible = cleanRequestedCrops.length === 0 || bestCentre.cropMatchRate === 1.0;
  const isNearestAmongEligible = eligiblePool.every((c) => c.distanceKm >= bestCentre.distanceKm);

  // Evaluate optimal slot
  let optimalSlot = slots[0];
  if (slots.length > 0) {
    if (preferredSlotTime) {
      const preferred = slots.find((s) => s.shortTime === preferredSlotTime);
      if (preferred && (preferred.utilizationRate ?? 0) < 0.85) {
        optimalSlot = preferred;
      } else {
        optimalSlot = [...slots].sort(
          (a, b) => (a.utilizationRate ?? 0) - (b.utilizationRate ?? 0)
        )[0];
      }
    } else {
      optimalSlot = [...slots].sort(
        (a, b) => (a.utilizationRate ?? 0) - (b.utilizationRate ?? 0)
      )[0];
    }
  }

  // Travel time estimate: tractor/truck speed ~25 km/h
  const travelMinutes = Math.max(10, Math.round((bestCentre.distanceKm / 25) * 60));
  const advice = `Travel time is approx ${travelMinutes} mins. Leave ${travelMinutes + 15} minutes before your slot to complete gate reporting on time.`;

  const secondBest = eligiblePool[1] || scoredCentres.find((c) => c.centreId !== bestCentre.centreId);
  const timeSavedMinutes = secondBest
    ? Math.max(0, secondBest.estimatedWaitMinutes - bestCentre.estimatedWaitMinutes)
    : 0;

  // Build authentic explanation string
  const agencyLabel = bestCentre.agencyType ? `[${bestCentre.agencyType}] ` : "";
  let cropNote = "";
  if (cleanRequestedCrops.length > 0) {
    if (bestCentre.cropMatchRate === 1.0) {
      cropNote = `Official procurement centre for ${cleanRequestedCrops.join(", ")}. `;
    } else if (bestCentre.cropMatchRate > 0) {
      cropNote = `Partially accepts selected commodities. `;
    } else {
      cropNote = `⚠️ Note: No centre in this candidate list is mandated for ${cleanRequestedCrops.join(", ")}. `;
    }
  }

  const crossDistrictNote = bestCentre.isCrossDistrict && bestCentre.location
    ? ` (Nearest in ${bestCentre.location})`
    : isNearestAmongEligible
    ? " (Nearest authorized centre)"
    : "";

  const reasoning = `${agencyLabel}Recommended ${bestCentre.name}${crossDistrictNote} — ${cropNote}Shortest travel distance (${bestCentre.distanceKm.toFixed(1)} km) and fast clearance (~${bestCentre.estimatedWaitMinutes}m wait) with ${bestCentre.baysAvailable ?? 4} operational bays.`;

  const bestCentreObj = {
    centreId: bestCentre.centreId,
    name: bestCentre.name,
    distance: `${bestCentre.distanceKm.toFixed(1)} km away`,
    distanceKm: bestCentre.distanceKm,
    location: bestCentre.location,
    isCrossDistrict: Boolean(bestCentre.isCrossDistrict),
    isCompatible,
    isFullyCompatible,
    isNearest: isNearestAmongEligible,
    waitMinutes: bestCentre.estimatedWaitMinutes,
    estimatedWaitMinutes: bestCentre.estimatedWaitMinutes,
    activeQueueCount: bestCentre.activeQueueCount,
    baysAvailable: bestCentre.baysAvailable ?? 4,
    score: bestCentre.score,
    acceptedCrops: bestCentre.acceptedCrops,
    agencyType: bestCentre.agencyType,
    reason: `${agencyLabel}${cropNote}Shortest distance (${bestCentre.distanceKm.toFixed(1)} km) with ${bestCentre.estimatedWaitMinutes}m expected wait.`,
  };

  const slotCapacity = optimalSlot?.maxCapacity ?? 15;
  const slotBooked = optimalSlot?.bookedCount ?? 0;
  const availableSeats = Math.max(0, optimalSlot?.availableSeats ?? (slotCapacity - slotBooked));

  const slotObj = {
    slotId: optimalSlot?.slotId ?? "default",
    shortTime: optimalSlot?.shortTime ?? "10:30 AM",
    timeWindow: optimalSlot?.timeWindow ?? "10:30 AM – 11:00 AM",
    availableCapacity: availableSeats,
    availableSeats,
    utilizationRate: optimalSlot?.utilizationRate ?? 0.2,
    reason: `Low congestion window with ${availableSeats} bays currently open.`,
  };

  return {
    recommendedCentre: bestCentreObj,
    bestCentre: bestCentreObj,
    optimalSlot: slotObj,
    recommendedSlot: slotObj,
    timeSavedMinutes,
    reasoning,
    cropCompatibilitySummary: {
      requestedCrops: cleanRequestedCrops,
      isFullyCompatible,
      acceptedByBestCentre: (bestCentre.acceptedCrops || []).filter((ac) =>
        cleanRequestedCrops.some((rc) => normalizeCropName(rc) === normalizeCropName(ac))
      ),
    },
    departureAdvisor: {
      suggestedDepartureTime: optimalSlot ? optimalSlot.shortTime : "10:00 AM",
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
      cropMatchRate: c.cropMatchRate,
    })),
  };
}
