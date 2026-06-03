import ExcelJS from "exceljs";

export async function GET() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Officers");
  ws.columns = [
    { header: "Name", key: "name", width: 20 },
    { header: "Belt Number / Employee ID", key: "belt", width: 25 },
    { header: "Rank", key: "rank", width: 18 },
    { header: "Station", key: "station", width: 18 },
    { header: "Mobile Number", key: "mobile", width: 18 },
    { header: "Gender", key: "gender", width: 12 },
    { header: "Department/Unit", key: "dept", width: 20 },
    { header: "Joining Date", key: "join", width: 16 },
    { header: "Availability Status", key: "avail", width: 22 },
    { header: "Skills", key: "skills", width: 30 },
  ];
  ws.addRows([
    ["Asha Rao", "PC-1001", "Constable", "Central", "9000000001", "Female", "Traffic", "2022-01-15", "Available", "Traffic Control, First Aid"],
    ["Vikram Singh", "HC-2042", "Head Constable", "Central", "9000000002", "Male", "Law and Order", "2018-07-03", "Available", "Crowd Control"],
    ["Meera Patel", "SI-3011", "SI", "North", "9000000003", "Female", "Investigation", "2016-03-22", "Available", "VIP Security, Investigation"],
  ]);
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=officer_template.xlsx",
    },
  });
}
