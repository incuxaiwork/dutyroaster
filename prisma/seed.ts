import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as csv from "csv-parse/sync";

const prisma = new PrismaClient();

interface CsvRow {
  "S.No.": string;
  Rank: string;
  "G.No": string;
  Name: string;
  "Cell No.": string;
  "Nature of duty": string;
  Age: string;
}

async function main() {
  const csvPath = path.join(process.cwd(), "data", "officers.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");

  const records = csv.parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  console.log(`Read ${records.length} records from CSV`);

  await prisma.officer.deleteMany();

  const BATCH = 100;
  let inserted = 0;

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH).map((r) => ({
      serialNo: parseInt(r["S.No."], 10),
      rank: r["Rank"],
      gno: r["G.No"] || "-",
      name: r["Name"],
      cellNo: r["Cell No."] || "",
      natureOfDuty: r["Nature of duty"] || null,
      age: r["Age"] ? parseInt(r["Age"], 10) : null,
    }));

    await prisma.officer.createMany({ data: batch });
    inserted += batch.length;
    console.log(`Inserted ${inserted} / ${records.length}`);
  }

  console.log(`Seed complete. ${inserted} officers imported.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
