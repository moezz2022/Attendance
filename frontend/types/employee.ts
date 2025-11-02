export interface Employee {
  id: string;
  name?: string;
  matri?: string;
  fonc?: string;
  department_id?: number;
  status?: "active" | "inactive";
}

export type PartialEmployee = Partial<Employee>;


