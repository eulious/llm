export type ChangeEvent<T> = Event & { currentTarget: T; target: Element };
export const APP = "llm";

export interface Model {
  name: string;
  provider: string;
  model: string;
}

export const MODELS: Model[] = [
  { name: "4o-mini", provider: "openai", model: "gpt-4o-mini" },
  { name: "4o", provider: "openai", model: "gpt-4o" },
  { name: "o1-mini", provider: "openai", model: "o1-mini" },
  // { key: "o1-pre", name: "openai", model: "o1-preview" },
  { name: "flash", provider: "gemini", model: "models/gemini-2.0-flash-exp" },
  { name: "think", provider: "gemini", model: "gemini-2.5-pro-exp-03-25" }
] as const;

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function request(method: "GET" | "POST" | "PUT", path: string, post?: unknown) {
  const res = await fetch(`/api/${APP}${path}`, {
    method: method,
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post)
  });
  const json = await res.json();
  console.log(method, path, post, json);
  return json;
}

export const storage = new Proxy(JSON.parse(localStorage[APP] ?? "{}"), {
  set: (obj: { [x: string]: any }, prop: string, value: any) => {
    obj[prop] = value;
    localStorage[APP] = JSON.stringify(obj);
    return true;
  }
}) as {
  salt: string;
  model: string;
  history: Message[][];
};

export async function sha256(message: string): Promise<string> {
  const hex = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message))));
  return hex.map(b => b.toString(16).padStart(2, "0")).join("");
}
