import { Employee, PartialEmployee } from "../../types/employee";

const BASE_URL = "http://127.0.0.1:8000/api";

async function handleJson<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(text || "استجابة غير صالحة من الخادم");
  }
  const data = (await res.json()) as T;
  if (!res.ok) {
    type ErrorResponse = { message?: string };
    const message = (data as ErrorResponse)?.message || "حدث خطأ";
    throw new Error(message);
  }
  return data;
}

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch(`${BASE_URL}/employees`);
  return handleJson<Employee[]>(res);
}

export async function createEmployee(
  payload: PartialEmployee
): Promise<Employee> {
  console.log("Sending:", payload);
  const res = await fetch(`${BASE_URL}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson<Employee>(res);
}

export async function updateEmployee(
  id: string,
  payload: PartialEmployee
): Promise<Employee> {
  const res = await fetch(`${BASE_URL}/employees/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson<Employee>(res);
}

export async function deleteEmployee(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/employees/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "فشل حذف الموظف");
  }
}

export async function importEmployees(
  file: File
): Promise<{ success: boolean; message?: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/employees/import`, {
    method: "POST",
    body: form,
  });
  return handleJson(res);
}
