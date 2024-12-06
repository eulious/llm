export type ChangeEvent<T> = Event & { currentTarget: T; target: Element };

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function request(method: "GET" | "POST" | "PUT", path: string, post?: unknown) {
  const res = await fetch("/api/llm" + path, {
    method: method,
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post)
  });
  const json = await res.json();
  console.log(method, path, post, json);
  return json;
}

export const storage = new Proxy(JSON.parse(localStorage.llm ?? "{}"), {
  set: (obj: { [x: string]: any }, prop: string, value: any) => {
    obj[prop] = value;
    localStorage.llm = JSON.stringify(obj);
    return true;
  }
}) as {
  salt: string;
  model: string;
};

export async function sha256(message: string): Promise<string> {
  const hex = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message))));
  return hex.map(b => b.toString(16).padStart(2, "0")).join("");
}
