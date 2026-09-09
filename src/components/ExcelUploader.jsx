import { useState } from "react";
import * as XLSX from "xlsx";

export function ExcelUploader({ onDataImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [mapping, setMapping] = useState({
    name: "",
    price: "",
    unit: "",
    category: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError("");
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Get first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length === 0) {
          setError("The file appears to be empty.");
          setIsLoading(false);
          return;
        }

        // Show preview (first 5 rows)
        setPreview(jsonData.slice(0, 5));

        // Try to auto-map columns
        const headers = Object.keys(jsonData[0]);
        const autoMapping = {};

        // Auto-detect common column names
        const lowerHeaders = headers.map((h) => h.toLowerCase());

        const nameIndex = lowerHeaders.findIndex(
          (h) =>
            h.includes("name") ||
            h.includes("product") ||
            h.includes("item") ||
            h.includes("description"),
        );
        const priceIndex = lowerHeaders.findIndex(
          (h) =>
            h.includes("price") ||
            h.includes("cost") ||
            h.includes("rate") ||
            h.includes("amount"),
        );
        const unitIndex = lowerHeaders.findIndex(
          (h) =>
            h.includes("unit") ||
            h.includes("measure") ||
            h.includes("size") ||
            h.includes("weight"),
        );
        const categoryIndex = lowerHeaders.findIndex(
          (h) =>
            h.includes("category") ||
            h.includes("type") ||
            h.includes("dept") ||
            h.includes("section"),
        );

        if (nameIndex !== -1) autoMapping.name = headers[nameIndex];
        if (priceIndex !== -1) autoMapping.price = headers[priceIndex];
        if (unitIndex !== -1) autoMapping.unit = headers[unitIndex];
        if (categoryIndex !== -1) autoMapping.category = headers[categoryIndex];

        setMapping(autoMapping);
        setIsLoading(false);
      } catch (err) {
        setError("Error reading file: " + err.message);
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsLoading(false);
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    if (!mapping.name || !mapping.price) {
      setError('Please map at least "name" and "price" columns.');
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Transform data based on column mapping
        const transformedData = jsonData
          .map((row) => {
            const price = parseFloat(row[mapping.price]);
            if (isNaN(price)) {
              console.warn("Invalid price for row:", row);
              return null;
            }
            return {
              name: String(row[mapping.name] || "Unknown"),
              price: price,
              unit: mapping.unit ? String(row[mapping.unit] || "each") : "each",
              category: mapping.category
                ? String(row[mapping.category] || "General")
                : "General",
            };
          })
          .filter((item) => item !== null);

        if (transformedData.length === 0) {
          setError("No valid data found. Please check your column mapping.");
          setIsLoading(false);
          return;
        }

        // Create the grocery data structure
        const groceryData = {
          items: {},
          specials: {},
        };

        transformedData.forEach((item) => {
          const id = item.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
          groceryData.items[id] = item;
        });

        // Pass data back to parent
        onDataImported(groceryData);
        setError("");
        setIsLoading(false);
        alert(`✅ Successfully imported ${transformedData.length} items!`);
      } catch (err) {
        setError("Error importing data: " + err.message);
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // If no file selected, show upload button
  if (!file) {
    return (
      <div
        style={{
          padding: "2rem",
          border: "2px dashed #3a3a3a",
          borderRadius: "0.5rem",
          textAlign: "center",
        }}
      >
        <h3>📊 Import Grocery Data</h3>
        <p style={{ color: "#888", margin: "1rem 0" }}>
          Upload your Excel file with product prices
        </p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          style={{ margin: "1rem 0" }}
        />
        <p style={{ color: "#666", fontSize: "0.8rem" }}>
          Supported formats: .xlsx, .xls, .csv
        </p>
      </div>
    );
  }

  // Show preview and mapping
  return (
    <div style={{ padding: "1rem" }}>
      <h3>📊 Excel Preview</h3>

      {error && (
        <div
          style={{
            color: "#ff6666",
            background: "#331111",
            padding: "0.75rem",
            borderRadius: "0.25rem",
            margin: "1rem 0",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {isLoading && (
        <div style={{ color: "#888", textAlign: "center", padding: "1rem" }}>
          ⏳ Processing...
        </div>
      )}

      {!isLoading && preview.length > 0 && (
        <>
          <div style={{ margin: "1rem 0" }}>
            <h4>Column Mapping</h4>
            <p
              style={{
                color: "#888",
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
              }}
            >
              Tell us which columns contain your data:
            </p>
            <div
              style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}
            >
              {["name", "price", "unit", "category"].map((field) => (
                <div
                  key={field}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <label
                    style={{
                      width: "80px",
                      fontWeight: "bold",
                      color: "#e0e0e0",
                    }}
                  >
                    {field}:
                  </label>
                  <select
                    value={mapping[field] || ""}
                    onChange={(e) =>
                      setMapping({ ...mapping, [field]: e.target.value })
                    }
                    style={{
                      flex: 1,
                      padding: "0.3rem",
                      background: "#1a1a1a",
                      color: "#e0e0e0",
                      border: "1px solid #444",
                      borderRadius: "0.25rem",
                    }}
                  >
                    <option value="">Select column...</option>
                    {preview.length > 0 &&
                      Object.keys(preview[0]).map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                  </select>
                  {field === "name" && !mapping.name && (
                    <span style={{ color: "#ff8888", fontSize: "0.8rem" }}>
                      * Required
                    </span>
                  )}
                  {field === "price" && !mapping.price && (
                    <span style={{ color: "#ff8888", fontSize: "0.8rem" }}>
                      * Required
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{ overflow: "auto", maxHeight: "300px", margin: "1rem 0" }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr style={{ background: "#2d2d2d" }}>
                  {preview.length > 0 &&
                    Object.keys(preview[0]).map((key) => (
                      <th
                        key={key}
                        style={{
                          padding: "0.5rem",
                          border: "1px solid #3a3a3a",
                          textAlign: "left",
                        }}
                      >
                        {key}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((val, colIdx) => (
                      <td
                        key={colIdx}
                        style={{
                          padding: "0.5rem",
                          border: "1px solid #3a3a3a",
                        }}
                      >
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p
              style={{ color: "#666", fontSize: "0.8rem", marginTop: "0.5rem" }}
            >
              Showing first {preview.length} rows
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button
              onClick={handleImport}
              disabled={!mapping.name || !mapping.price || isLoading}
              style={{
                padding: "0.75rem 2rem",
                background:
                  !mapping.name || !mapping.price || isLoading
                    ? "#444"
                    : "#0a84ff",
                border: "none",
                borderRadius: "0.5rem",
                color: "#fff",
                fontWeight: "bold",
                cursor:
                  !mapping.name || !mapping.price || isLoading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {isLoading ? "⏳ Importing..." : "✅ Import Items"}
            </button>
            <button
              onClick={() => {
                setFile(null);
                setPreview([]);
                setMapping({ name: "", price: "", unit: "", category: "" });
                setError("");
              }}
              style={{
                padding: "1rem 2rem",
                background: "#4a4a4a",
                border: "none",
                borderRadius: "0.5rem",
                color: "#e1e1e1",
                cursor: "pointer",
              }}
            >
              🔄 Choose Different File
            </button>
          </div>
        </>
      )}
    </div>
  );
}
