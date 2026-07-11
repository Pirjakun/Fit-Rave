export interface Selection {
  employeeId: string;
  activityId: string;
  status: "confirmed";
  selectedAt: string;
}

export interface SelectionState {
  selection: Selection | null;
  openMarks: string[];
}
