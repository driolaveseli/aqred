export const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  const date = new Date().toISOString().slice(0, 10);
  // Prepend UTF-8 BOM so Excel opens the file with correct encoding
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
