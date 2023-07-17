import { TaskStatus } from "./types";

export class DealStatus {
  private static instance: DealStatus;

  status: { [dealId: string]: TaskStatus } = {};

  static getInstance(): DealStatus {
    if (!DealStatus.instance) {
      DealStatus.instance = new DealStatus();
    }
    return DealStatus.instance;
  }
}
