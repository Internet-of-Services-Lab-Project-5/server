export type InitSearchResponse =
  | {
      dealId: string;
    }
  | Error;

export type FetchResultsResponse =
  | {
      results: string[];
    }
  | Error;

export type CheckStatusResponse =
  | {
      status: string;
    }
  | Error;

export type IndexResponse =
  | {
      status: string;
    }
  | Error;

export type UpdateDatasetResponse =
  | {
      status: string;
    }
  | Error;

type Error = {
  error: string;
};

export type DBEntry = {
  firstname: string;
  lastname: string;
  birthdate: string;
  incident: string;
  incidentDate: string;
};
