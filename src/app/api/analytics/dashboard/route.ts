import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d.setDate(diff)).toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const total = await prisma.officer.count({ where: { is_active: true } });
  const available = await prisma.officer.count({ where: { is_active: true, availability_status: "Available" } });
  const onLeave = await prisma.officer.count({ where: { is_active: true, availability_status: "On Leave" } });
  const dutiesToday = await prisma.duty.count({ where: { start_date: today } });
  const pending = await prisma.duty.count({ where: { status: "Pending Allocation" } });
  const allocated = await prisma.duty.count({ where: { status: "Allocated" } });
  const inProgress = await prisma.duty.count({ where: { status: "In Progress" } });
  const completed = await prisma.duty.count({ where: { status: "Completed" } });

  const weeklyData = await prisma.dutyAssignment.groupBy({
    by: ["officer_id"],
    where: { assignment_date: { gte: weekStart } },
    _sum: { working_hours: true },
  });

  const weeklyHours = weeklyData
    .map((r) => ({ officer_id: r.officer_id, hours: r._sum.working_hours ?? 0 }))
    .sort((a, b) => b.hours - a.hours);

  const officerIds = [...new Set(weeklyHours.map((r) => r.officer_id))];
  const officers = officerIds.length
    ? await prisma.officer.findMany({ where: { id: { in: officerIds } }, select: { id: true, name: true } })
    : [];
  const officerMap = Object.fromEntries(officers.map((o) => [o.id, o.name]));

  const weeklyNamed = weeklyHours.map((r) => ({ name: officerMap[r.officer_id] ?? `#${r.officer_id}`, hours: r.hours }));

  const shiftData = await prisma.dutyAssignment.groupBy({
    by: ["shift_type"],
    _sum: { working_hours: true },
  });

  const shiftBreakdown = shiftData.map((r) => ({ name: r.shift_type, hours: r._sum.working_hours ?? 0 }));

  const stationData = await prisma.officer.groupBy({
    by: ["station"],
    where: { is_active: true },
    _count: { id: true },
  });
  const stationDeployment = stationData.map((r) => ({ name: r.station, count: r._count.id }));

  const rankData = await prisma.officer.groupBy({
    by: ["rank"],
    where: { is_active: true },
    _count: { id: true },
  });
  const rankDeployment = rankData.map((r) => ({ name: r.rank, count: r._count.id }));

  const activeStatuses = ["Pending Allocation", "Allocated", "In Progress", "Completed"];
  const dutyCount = await prisma.duty.count({ where: { status: { in: activeStatuses } } });
  const coveredStatuses = ["Allocated", "In Progress", "Completed"];
  const covered = await prisma.duty.count({ where: { status: { in: coveredStatuses } } });

  const hours = weeklyHours.map((r) => r.hours).filter((h) => h > 0);
  const fairness = hours.length > 1
    ? Math.max(0, Math.round((100 - (Math.max(...hours) - Math.min(...hours))) * 100) / 100)
    : 0;

  return Response.json({
    cards: {
      total_officers: total,
      available_officers: available,
      officers_on_leave: onLeave,
      total_duties_today: dutiesToday,
      pending_duties: pending,
      allocated_duties: allocated,
      in_progress_duties: inProgress,
      completed_duties: completed,
      fairness_score: fairness,
      duty_coverage_percentage: dutyCount ? Math.round((covered / dutyCount) * 10000) / 100 : 0,
    },
    weekly_hours: weeklyNamed,
    monthly_hours: weeklyNamed.map((r) => ({ name: r.name, hours: Math.round(r.hours * 4 * 100) / 100 })),
    shift_breakdown: shiftBreakdown,
    station_deployment: stationDeployment,
    rank_deployment: rankDeployment,
    most_utilized: weeklyNamed.slice(0, 5),
    least_utilized: [...weeklyNamed].reverse().slice(0, 5),
    overtime: weeklyNamed.filter((r) => r.hours > 48),
    under_utilization: weeklyNamed.filter((r) => r.hours < 8),
  });
}
