export interface DecodedVinData {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine: string;
  drive_type: string;
  body_style: string;
  plant_country: string;
  recalls_count?: number;
  recall_summary?: string[];
}

export async function decodeVinNumber(vin: string): Promise<DecodedVinData> {
  const cleanVin = vin.trim().toUpperCase();
  if (cleanVin.length !== 17) {
    throw new Error("A valid VIN must be exactly 17 characters.");
  }

  let res: Response;
  try {
    res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${cleanVin}?format=json`
    );
  } catch {
    throw new Error(
      "Couldn't reach the NHTSA VIN service. Check your connection or enter the details manually."
    );
  }

  if (!res.ok) {
    throw new Error(
      "The NHTSA VIN service is unavailable right now. Enter the details manually."
    );
  }

  const data = await res.json();
  const result = data.Results?.[0];

  if (!result || !result.Make) {
    throw new Error(
      "That VIN didn't return any vehicle details. Double-check it or enter the details manually."
    );
  }

  const year = parseInt(result.ModelYear) || new Date().getFullYear();
  const make = result.Make;
  const model = result.Model || "";
  const trim = result.Trim || result.Series || "";
  const engine = [
    result.DisplacementL ? `${result.DisplacementL}L` : "",
    result.EngineConfiguration && result.EngineCylinders
      ? `${result.EngineConfiguration}${result.EngineCylinders}`
      : result.EngineCylinders
      ? `${result.EngineCylinders}-cyl`
      : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const drive_type = result.DriveType || "";
  const body_style = result.BodyClass || "";
  const plant_country = result.PlantCountry || "";

  return {
    vin: cleanVin,
    year,
    make,
    model,
    trim,
    engine,
    drive_type,
    body_style,
    plant_country,
  };
}
