const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export type Category = { id: number; name: string };
export async function fetchHealth(){const response=await fetch(API_BASE_URL+"/api/health");if(!response.ok)throw new Error("Unable to connect to TokTickIT API");return response.json() as Promise<{status:"ok";service:string}>;}
export async function fetchCategories(): Promise<Category[]>{const response=await fetch(API_BASE_URL+"/api/categories");if(!response.ok)throw new Error("Unable to load request categories");return response.json() as Promise<Category[]>;}
