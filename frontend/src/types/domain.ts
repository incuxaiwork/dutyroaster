export type Role = "Admin" | "DSP" | "CI" | "SI" | "Viewer";
export type AvailabilityStatus = "Available" | "On Leave" | "Training" | "Suspended" | "Special Assignment";
export type ShiftType = "Morning" | "Evening" | "Night" | "Custom";
export type DutyStatus = "Draft" | "Pending Allocation" | "Allocated" | "In Progress" | "Completed" | "Cancelled";
export type PriorityLevel = "Critical" | "High" | "Medium" | "Low";

export type Officer = {
  id: number;
  name: string;
  belt_number: string;
  rank: string;
  station: string;
  mobile_number?: string;
  gender?: string;
  department_unit?: string;
  joining_date?: string;
  availability_status: AvailabilityStatus;
  is_active: boolean;
  skills: string[];
  weekly_hours: number;
  monthly_hours: number;
};

export type Duty = {
  id: number;
  duty_name: string;
  duty_type: string;
  location?: string;
  start_date: string;
  end_date?: string;
  start_time: string;
  end_time: string;
  shift_type: ShiftType;
  required_officers: number;
  required_rank?: string;
  required_skills: string[];
  priority_level: PriorityLevel;
  special_instructions?: string;
  status: DutyStatus;
  incharge_officer_id?: number | null;
  incharge_officer_name?: string | null;
  incharge_officer_rank?: string | null;
  incharge_officer_belt?: string | null;
  created_at?: string;
};

export type Assignment = {
  id: number;
  duty_id: number;
  officer_id: number;
  roster_batch_id?: number;
  assignment_date: string;
  start_time: string;
  end_time: string;
  shift_type: ShiftType;
  working_hours: number;
  is_locked: boolean;
  officer_name?: string;
  belt_number?: string;
  station?: string;
  duty_name?: string;
  location?: string;
};

export type DashboardAnalytics = {
  cards: Record<string, number>;
  weekly_hours: { name: string; hours: number }[];
  monthly_hours: { name: string; hours: number }[];
  shift_breakdown: { name: string; hours: number }[];
  station_deployment: { name: string; count: number }[];
  rank_deployment: { name: string; count: number }[];
  most_utilized: { name: string; hours: number }[];
  least_utilized: { name: string; hours: number }[];
  overtime: { name: string; hours: number }[];
  under_utilization: { name: string; hours: number }[];
};
