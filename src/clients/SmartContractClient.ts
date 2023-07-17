import metadata from "../AirlineWalletListManager.json" assert { type: "json" };
import { AlchemyProvider, Wallet, Contract } from "ethers";

const ABI = metadata.abi;

export class AirlineListController {
  private static instance: AirlineListController;

  private contract?: Contract;
  constructor() {}

  static getInstance(): AirlineListController {
    if (!AirlineListController.instance) {
      AirlineListController.instance = new AirlineListController();
      AirlineListController.instance.init();
    }
    return AirlineListController.instance;
  }

  private async init() {
    const { ALCHEMY_KEY, ETH_PRIVATE_KEY, SMART_CONTRACT_ADDRESS } = process.env;
    const provider = new AlchemyProvider("sepolia", ALCHEMY_KEY);
    const wallet = new Wallet(ETH_PRIVATE_KEY as string, provider);
    this.contract = new Contract(SMART_CONTRACT_ADDRESS as string, ABI, wallet);
    console.log("contract", this.contract);
  }

  async proposeAirline(name: string, ethAddress: string, iExecAddress: string) {
    if (!this.contract) {
      console.log("contract not initiated yet");
      return;
    }
    console.log("contract", this.contract);
    const propose: (name: string, ethAddress: string, iExecAddress: string) => Promise<any> =
      this.contract.getFunction("propose");
    const result = await propose(name, ethAddress, iExecAddress);
    console.log("result", result);
  }

  async isVoting() {
    if (!this.contract) {
      console.log("contract not initiated yet");
      return;
    }
    const isVoting: () => Promise<any> = this.contract.getFunction("isVoting");
    const result = await isVoting();
    console.log("result", result);
  }

  async getCandidate() {
    if (!this.contract) {
      console.log("contract not initiated yet");
      return;
    }
    const getCandidate: () => Promise<any> = this.contract.getFunction("candidate");
    const result = await getCandidate();
    console.log("result", result);
  }

  onPropose(callback: (data?: any) => void) {
    if (!this.contract) {
      console.log("contract not initiated yet");
      return;
    }
    this.contract.on("AirlineProposed", callback);
    console.log("listening");
  }

  async vote(saysYes: boolean) {
    if (!this.contract) {
      console.log("contract not initiated yet");
      return;
    }
    const vote: (saysYes: boolean) => Promise<any> = this.contract.getFunction("vote");
    const result = await vote(saysYes);
    console.log("result", result);
  }

  async getAirlines() {
    if (!this.contract) {
      console.log("contract not initiated yet");
      return;
    }
    const airlineCount = await this.contract.airlineCount();
    const result = [];
    for (let i = 0; i < airlineCount; i++) {
      const airline = await this.contract.airlines(i);
      result.push({
        name: airline[0],
        ethAddress: airline[1],
        iExecAddress: airline[2],
      });
    }
    return result;
  }
}
