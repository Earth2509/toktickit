const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type Category = {
  id: number;
  name: string;
};

export type RelatedSystem = {
  id: number;
  name: string;
};

export type Requester = {
  id: number;
  displayName: string;
  email: string;
};

type HealthCheck = {
  status: "ok";
  service: string;
};

export async function fetchHealth(): Promise<HealthCheck> {
  let response: Response;

  try {
    response = await fetch(API_BASE_URL + "/api/health");
  } catch {
    throw new Error("Unable to connect to TokTickIT API");
  }

  if (!response.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }

  return response.json() as Promise<HealthCheck>;
}

export async function fetchCategories(): Promise<Category[]> {
  return fetchReferenceData<Category[]>("/api/categories", "Unable to load request categories");
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  return fetchReferenceData<RelatedSystem[]>("/api/related-systems", "Unable to load related systems");
}

export async function fetchRequesters(): Promise<Requester[]> {
  return fetchReferenceData<Requester[]>("/api/requesters", "Unable to load Development Requesters");
}

async function fetchReferenceData<T>(path: string, errorMessage: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(API_BASE_URL + path);
  } catch {
    throw new Error(errorMessage);
  }

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
