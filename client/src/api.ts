const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type HealthResponse = {
  status: "ok";
  service: string;
};

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(API_BASE_URL + "/api/health");

  if (!response.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }

  return response.json() as Promise<HealthResponse>;
}
