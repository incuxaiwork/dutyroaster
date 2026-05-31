const { v4: uuidv4 } = require('uuid');

const RANK_LEVELS = {
  'Constable': 0,
  'Head Constable': 1,
  'Sub-Inspector': 2,
  'Inspector': 3,
  'DSP': 4,
  'SP': 5
};

function parseTimeToHours(timeString) {
  if (!timeString) return 0;
  const [h, m] = timeString.split(':').map(Number);
  return h + (m || 0) / 60;
}

function getRestHours(prevShift, nextShift) {
  if (!prevShift) return 24; // Fully rested
  const prevStart = parseTimeToHours(prevShift.startTime);
  let prevEnd = parseTimeToHours(prevShift.endTime);
  if (prevEnd < prevStart) {
    prevEnd += 24; // Crosses midnight
  }
  const nextStart = parseTimeToHours(nextShift.startTime) + 24; // relative to yesterday's midnight
  return nextStart - prevEnd;
}

function rankMeet(officerRank, requiredRank) {
  if (!requiredRank) return true;
  return (RANK_LEVELS[officerRank] || 0) >= (RANK_LEVELS[requiredRank] || 0);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateRoster({ officers, duties, config, instructions, onLog, onStatus }) {
  const period = config.rosterPeriod || 14;
  const startDateStr = config.startDate || new Date().toISOString().split('T')[0];
  const minOfficers = config.minOfficersPerShift || 2;
  const nightShiftWeight = config.nightShiftWeight || 2;
  const weekendWeight = config.weekendWeight || 2;
  const maxConsecutive = config.maxConsecutiveShifts || 5;
  const minRestHours = config.restHoursBetweenShifts || 12;
  const priorityMode = config.priorityMode || 'balanced';

  onStatus('Initializing AI Engine...');
  await sleep(150);
  onLog(`🚀 Initializing roster generation for ${period} days...\n`);
  onLog(`🏛️ Station: ${config.stationName || 'City Police HQ'}\n`);
  onLog(`👮 Personnel count: ${officers.length} officers enrolled\n`);
  onLog(`📋 Active duty types: ${duties.map(d => d.code).join(', ')}\n`);
  onLog(`⚖️ Priority mode: ${priorityMode}\n\n`);
  await sleep(200);

  // Parse instructions
  onStatus('Analyzing special instructions...');
  const avoidNights = new Set();
  const avoidWeekends = new Set();
  const avoidDuties = new Map(); // officerId -> Set of duty codes
  const preferDuties = new Map(); // officerId -> Set of duty codes
  let minSeniorsPerShift = 0;

  if (instructions) {
    onLog(`🔍 Parsing custom constraints from instructions...\n`);
    const lowerIns = instructions.toLowerCase();

    // Check individual officer constraints
    for (const officer of officers) {
      const nameParts = officer.name.toLowerCase().split(/\s+/);
      const isMentioned = nameParts.some(part => part.length > 2 && lowerIns.includes(part)) || lowerIns.includes(officer.id.toLowerCase());
      
      if (isMentioned) {
        if (lowerIns.includes('avoid night') || lowerIns.includes('no night') || lowerIns.includes('except night') || lowerIns.includes('not on night')) {
          avoidNights.add(officer.id);
          onLog(`   └─ Ruleset: [${officer.name}] should avoid NIGHT shifts\n`);
        }
        if (lowerIns.includes('avoid weekend') || lowerIns.includes('no weekend') || lowerIns.includes('not on weekend')) {
          avoidWeekends.add(officer.id);
          onLog(`   └─ Ruleset: [${officer.name}] should avoid WEEKEND duties\n`);
        }
        if (lowerIns.includes('avoid morning') || lowerIns.includes('no morning')) {
          if (!avoidDuties.has(officer.id)) avoidDuties.set(officer.id, new Set());
          avoidDuties.get(officer.id).add('MORNING');
          onLog(`   └─ Ruleset: [${officer.name}] should avoid MORNING shifts\n`);
        }
        if (lowerIns.includes('avoid evening') || lowerIns.includes('no evening')) {
          if (!avoidDuties.has(officer.id)) avoidDuties.set(officer.id, new Set());
          avoidDuties.get(officer.id).add('EVENING');
          onLog(`   └─ Ruleset: [${officer.name}] should avoid EVENING shifts\n`);
        }
      }
    }

    // Check general rules
    const seniorMatch = lowerIns.match(/(ensure|at least)\s+(\d+)\s+senior/);
    if (seniorMatch) {
      minSeniorsPerShift = parseInt(seniorMatch[2]);
      onLog(`   └─ Ruleset: Ensure at least ${minSeniorsPerShift} senior officer(s) (Head Constable+) per shift\n`);
    } else if (lowerIns.includes('ensure senior') || lowerIns.includes('need senior')) {
      minSeniorsPerShift = 1;
      onLog(`   └─ Ruleset: Ensure at least 1 senior officer (Head Constable+) per shift\n`);
    }
    await sleep(250);
  }
  onLog(`\n`);

  // Initialize stats tracking
  const stats = {};
  for (const o of officers) {
    stats[o.id] = {
      officer_id: o.id,
      officer_name: o.name,
      total_shifts: 0,
      night_shifts: 0,
      morning_shifts: 0,
      evening_shifts: 0,
      weekend_shifts: 0,
      off_days: 0,
      consecutive_work_days: 0,
      last_assigned_date: null,
      last_assigned_shift: null
    };
  }

  const rosterDays = [];
  const alerts = [];

  onStatus('Solving duty assignments...');

  // Start Date parsing
  const startDate = new Date(startDateStr);

  for (let d = 1; d <= period; d++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + (d - 1));
    const dateString = currentDate.toISOString().split('T')[0];
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6; // Sunday or Saturday

    onLog(`📅 Day ${d}: ${dateString} (${dayName})${isWeekend ? ' [WEEKEND]' : ''}\n`);
    await sleep(100);

    const dayAssignments = [];
    const assignedToday = new Set();

    // Loop through each duty type
    for (const duty of duties) {
      const isNightShift = duty.color === 'night';
      onLog(`   Shift ${duty.code} (${duty.startTime} - ${duty.endTime}):\n`);

      // Determine how many officers to assign. We default to config minOfficersPerShift.
      const slotsNeeded = minOfficers;
      const assignedToShift = [];

      for (let slot = 1; slot <= slotsNeeded; slot++) {
        // Find best eligible officer
        let bestOfficer = null;
        let bestCost = Infinity;
        let selectionReason = '';
        let constraintRelaxed = false;

        // Candidate evaluation
        const candidates = [];

        for (const officer of officers) {
          if (assignedToday.has(officer.id)) continue; // Already working another shift today

          const oStats = stats[officer.id];
          const isUnavailable = officer.unavailDates?.includes(dateString);

          // Hard Constraint Check (Unavailability)
          if (isUnavailable) continue;

          // Rank Check
          const rankOk = rankMeet(officer.rank, duty.requiredRank);
          if (!rankOk) continue; // Officer does not meet rank requirement

          // Rest Hours check
          let prevShift = null;
          if (oStats.last_assigned_date) {
            // Check if last assignment was yesterday
            const lastDate = new Date(oStats.last_assigned_date);
            const diffDays = Math.round((currentDate - lastDate) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              prevShift = duties.find(u => u.code === oStats.last_assigned_shift);
            }
          }
          const restHrs = getRestHours(prevShift, duty);
          const restOk = restHrs >= minRestHours;

          // Consecutive Days check
          const consecutiveOk = oStats.consecutive_work_days < maxConsecutive;

          // Instruction Check (avoid night/weekend shifts)
          const isAvoidNight = isNightShift && avoidNights.has(officer.id);
          const isAvoidWeekend = isWeekend && avoidWeekends.has(officer.id);
          const isAvoidDuty = avoidDuties.get(officer.id)?.has(duty.code);

          const meetsAllHard = restOk && consecutiveOk && !isAvoidNight && !isAvoidWeekend && !isAvoidDuty;

          // Score / cost computation
          let cost = oStats.total_shifts * 10;

          // Weighted costs for night/weekend shifts
          if (isNightShift) {
            cost += oStats.night_shifts * nightShiftWeight * 8;
          }
          if (isWeekend) {
            cost += oStats.weekend_shifts * weekendWeight * 8;
          }

          // Penalize consecutive work to spread shifts out
          if (oStats.consecutive_work_days > 0) {
            cost += oStats.consecutive_work_days * 5;
          }

          // Priority Modes
          if (priorityMode === 'seniority') {
            const level = RANK_LEVELS[officer.rank] || 0;
            if (isNightShift || isWeekend) {
              cost += level * 15; // Penalize senior officers for night/weekend shifts
            } else {
              cost -= level * 5; // Prefer senior officers for normal day shifts
            }
          } else if (priorityMode === 'rotation') {
            // Pure rotation: cost depends on last assigned date (prefer the one who worked longest ago)
            if (oStats.last_assigned_date) {
              const lastDate = new Date(oStats.last_assigned_date);
              const daysAgo = Math.round((currentDate - lastDate) / (1000 * 60 * 60 * 24));
              cost -= daysAgo * 12; // Farther in past = lower cost
            } else {
              cost -= 100; // Never assigned = lowest cost
            }
          }

          candidates.push({
            officer,
            meetsAllHard,
            restOk,
            consecutiveOk,
            isAvoidNight,
            isAvoidWeekend,
            isAvoidDuty,
            cost,
            restHrs
          });
        }

        // Selection: First look for candidates that meet all hard constraints
        let filteredCandidates = candidates.filter(c => c.meetsAllHard);

        // If no candidates meet all hard constraints, relax soft constraints
        if (filteredCandidates.length === 0) {
          // Relax consecutive work days, then rest hours, then special avoidances
          filteredCandidates = candidates.filter(c => c.restOk);
          constraintRelaxed = true;
          selectionReason = 'Consecutive shift limit relaxed';

          if (filteredCandidates.length === 0) {
            // If still empty, relax rest hours too
            filteredCandidates = candidates;
            selectionReason = 'Rest hours limit relaxed';
          }
        }

        if (filteredCandidates.length > 0) {
          // Sort by cost (ascending)
          filteredCandidates.sort((a, b) => a.cost - b.cost);
          
          // Senior Officer Rule Check: If we need a senior officer and haven't assigned one yet
          // in the current shift slots, we can bias towards a senior officer.
          const currentShiftSeniors = assignedToShift.filter(oId => {
            const o = officers.find(x => x.id === oId);
            return (RANK_LEVELS[o.rank] || 0) >= 1; // Head Constable+
          }).length;

          // If we are on the last slot of the shift and still need a senior officer
          if (minSeniorsPerShift > 0 && currentShiftSeniors < minSeniorsPerShift && slot === slotsNeeded) {
            const seniorCandidates = filteredCandidates.filter(c => (RANK_LEVELS[c.officer.rank] || 0) >= 1);
            if (seniorCandidates.length > 0) {
              bestOfficer = seniorCandidates[0].officer;
              if (constraintRelaxed) selectionReason += ' & Senior requirement enforced';
              else selectionReason = 'Senior requirement enforced';
            }
          }

          if (!bestOfficer) {
            bestOfficer = filteredCandidates[0].officer;
          }

          // Log warning if constraint was relaxed
          const details = candidates.find(c => c.officer.id === bestOfficer.id);
          if (!details.meetsAllHard) {
            let warnMsg = '';
            if (!details.consecutiveOk) {
              warnMsg = `Officer [${bestOfficer.name}] exceeded consecutive shifts constraint (assigned ${stats[bestOfficer.id].consecutive_work_days + 1} days consecutively).`;
            } else if (!details.restOk) {
              warnMsg = `Officer [${bestOfficer.name}] has short rest interval (${details.restHrs.toFixed(1)} hours).`;
            } else {
              warnMsg = `Officer [${bestOfficer.name}] assigned to shift despite avoid request.`;
            }
            alerts.push(warnMsg);
            onLog(`     ⚠️ WARNING: ${warnMsg}\n`);
          }

          assignedToShift.push(bestOfficer.id);
          assignedToday.add(bestOfficer.id);

          // Update officer stats immediately
          const oStats = stats[bestOfficer.id];
          oStats.total_shifts++;
          oStats.last_assigned_date = dateString;
          oStats.last_assigned_shift = duty.code;
          if (isNightShift) oStats.night_shifts++;
          if (duty.color === 'morning') oStats.morning_shifts++;
          if (duty.color === 'evening') oStats.evening_shifts++;
          if (isWeekend) oStats.weekend_shifts++;

          onLog(`     ├─ Slot ${slot}: [${bestOfficer.name}] (${bestOfficer.rank}) ${selectionReason ? `[${selectionReason}]` : ''}\n`);
        } else {
          onLog(`     ├─ Slot ${slot}: ❌ NO ELIGIBLE PERSONNEL FOUND\n`);
          alerts.push(`Day ${d} shift ${duty.code} slot ${slot} remained unassigned due to staffing constraints.`);
        }
      }

      // Record assignments
      assignedToShift.forEach(officerId => {
        const officer = officers.find(x => x.id === officerId);
        dayAssignments.push({
          officer_id: officerId,
          officer_name: officer.name,
          duty_code: duty.code
        });
      });
    }

    // End of day updates: Update consecutive days and off days for ALL officers
    for (const officer of officers) {
      const oStats = stats[officer.id];
      if (assignedToday.has(officer.id)) {
        oStats.consecutive_work_days++;
      } else {
        oStats.consecutive_work_days = 0;
        oStats.off_days++;
      }
    }
    rosterDays.push({
      day: d,
      date: dateString,
      dayName: dayName,
      assignments: dayAssignments
    });
    onLog(`\n`);
  }

  // Post-processing: Calculate equity scores
  onStatus('Calculating equity scores...');
  const totals = Object.values(stats).map(s => s.total_shifts);
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  
  for (const officer of officers) {
    const oStats = stats[officer.id];
    let eq = 100;
    if (avg > 0) {
      const dev = Math.abs(oStats.total_shifts - avg);
      eq = Math.max(0, Math.round(100 - (dev / avg) * 100));
    }
    oStats.equity_score = eq;
  }

  const finalAvg = avg;
  const maxDev = Math.max(...totals.map(v => Math.abs(v - finalAvg)));
  const globalEquity = finalAvg > 0 ? Math.max(0, Math.round(100 - (maxDev / finalAvg) * 100)) : 100;

  onLog(`✨ Optimization cycle completed successfully.\n`);
  onLog(`📊 Final Equity Score: ${globalEquity}%\n`);
  onLog(`📉 Average workload: ${finalAvg.toFixed(1)} shifts per officer\n\n`);

  await sleep(150);

  const rosterObj = {
    id: uuidv4(),
    generatedAt: new Date().toISOString(),
    summary: `Equitable duty schedule generated with a workload equity score of ${globalEquity}% and average shifts of ${finalAvg.toFixed(1)} per officer.`,
    alerts,
    config: {
      stationName: config.stationName,
      rosterPeriod: period,
      startDate: startDateStr
    },
    officer_stats: Object.values(stats),
    roster: rosterDays
  };

  return rosterObj;
}

module.exports = { generateRoster };
