import React from "react";

const Table = ({ data, columns }) => (
  <table className="w-full border border-gray-200 rounded-lg overflow-hidden shadow">
    <thead className="bg-blue-500 text-white">
      <tr>
        {columns.map((col, idx) => (
          <th key={idx} className="px-4 py-2 text-left">
            {col.header}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr
          key={row.id}
          className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
        >
          {columns.map((col, idx) => (
            <td key={idx} className="border px-4 py-2">
              {col.accessor === "actions" && col.Cell
                ? col.Cell({ row })
                : row[col.accessor]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export default Table;
