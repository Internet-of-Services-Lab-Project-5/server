export type DBEntry = {
  firstname: string;
  lastname: string;
  birthdate: string;
  incident: string;
  incidentDate: string;
};

export type Passenger = {
  firstname: string;
  lastname: string;
  birthdate: string;
};

export type DealProgress = {
  dealId: string;
  tasksCount: number;
  tasksDone: number;
};
