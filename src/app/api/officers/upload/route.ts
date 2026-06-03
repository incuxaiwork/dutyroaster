import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer() as any);
  const ws = wb.worksheets[0];

  const rows: Array<Record<string, any>> = [];
  const headerRow = ws.getRow(1);
  const cols: Record<string, number> = {};
  headerRow.eachCell((c, i) => { cols[String(c.value).toLowerCase().trim()] = i; });

  const col = (alias: string[]) => {
    for (const a of alias) {
      const idx = cols[a.toLowerCase()];
      if (idx) return idx;
    }
    return 0;
  };

  const cName = col(["name"]);
  const cBelt = col(["belt number / employee id", "belt_number", "g.no", "gno", "employee id"]);
  const cRank = col(["rank"]);
  const cStation = col(["station"]);
  const cMobile = col(["mobile number", "mobile_number", "cell no.", "cell no"]);
  const cGender = col(["gender"]);
  const cDept = col(["department/unit", "department_unit"]);
  const cJoin = col(["joining date", "joining_date"]);
  const cAvail = col(["availability status", "availability_status"]);
  const cSkills = col(["skills"]);

  let count = 0;
  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const getVal = (idx: number) => (idx ? String(row.getCell(idx).value ?? "") : "");
    let belt = getVal(cBelt);
    if (!belt) belt = `-${rowNum}`;

    rows.push({
      belt_number: belt,
      name: getVal(cName),
      rank: getVal(cRank),
      station: getVal(cStation),
      mobile_number: getVal(cMobile) || null,
      gender: getVal(cGender) || null,
      department_unit: getVal(cDept) || null,
      joining_date: getVal(cJoin) || null,
      availability_status: getVal(cAvail) || "Available",
      skills: getVal(cSkills) ? getVal(cSkills).split(",").map((s: string) => s.trim()).filter(Boolean) : [],
    });
    count++;
  });

  for (const r of rows) {
    const existing = await prisma.officer.findUnique({ where: { belt_number: r.belt_number } });
    if (existing) continue;
    const officer = await prisma.officer.create({
      data: {
        belt_number: r.belt_number,
        name: r.name,
        rank: r.rank,
        station: r.station,
        mobile_number: r.mobile_number,
        gender: r.gender,
        department_unit: r.department_unit,
        joining_date: r.joining_date,
        availability_status: r.availability_status as string,
        is_active: true,
      },
    });
    for (const skillName of r.skills) {
      const skill = await prisma.skill.upsert({ where: { name: skillName }, update: {}, create: { name: skillName } });
      await prisma.officerSkill.create({ data: { officer_id: officer.id, skill_id: skill.id } }).catch(() => {});
    }
  }

  await prisma.uploadedFile.create({ data: { filename: file.name, file_type: "officers_excel", row_count: count } });
  return Response.json({ imported: count });
}
