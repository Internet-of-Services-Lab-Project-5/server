import { IExec, utils } from "iexec";
import { Wallet } from "ethers";
import wallet from "../wallet.json" assert { type: "json" };
import AdmZip from "adm-zip";
import { Web3Storage, getFilesFromPath } from "web3.storage";
import * as fs from "fs";
import { Parser } from "json2csv";
import { DatabaseController } from "./DatabaseController.ts";

const APP_ADDRESS = process.env.COORDINATOR_APP_ADDRESS || "";
const DATASET_ADDRESS = "0x50382Ac47b6f47B83B0486104a836B93402efD85";
const apiToken = process.env.WEB3STORAGE_TOKEN || "";

export class iExecController {
  private iexec?: IExec;
  private static instance: iExecController;
  constructor() {}

  static async getInstance(): Promise<iExecController> {
    if (!iExecController.instance) {
      iExecController.instance = new iExecController();
      await iExecController.instance.init();
    }
    return iExecController.instance;
  }

  private async init() {
    const { privateKey } = await Wallet.fromEncryptedJson(
      JSON.stringify(wallet),
      process.env.IEXEC_WALLET_PASSWORD as string
    );
    const signer = utils.getSignerFromPrivateKey("bellecour", privateKey);
    this.iexec = new IExec(
      { ethProvider: signer },
      { smsURL: "https://sms.scone-debug.v8-bellecour.iex.ec" }
    );
  }

  async fetchApps() {
    if (!this.iexec) {
      console.log("iexec not initiated yet");
      return;
    }
    const userAddress = await this.iexec.wallet.getAddress();
    const count = (await this.iexec.app.countUserApps(userAddress)) as unknown as number;
    console.log(`APP COUNT ${count}`);
    for (let i = 0; i < count; i++) {
      const app = await this.iexec.app.showUserApp(i, userAddress);
      console.log(`APP ${i} `);
      console.log(app);
    }
  }

  async order(firstname: string, lastname: string, birthdate: string) {
    if (!this.iexec) {
      console.log("iexec not initiated yet");
      return;
    }
    const category = 0;

    try {
      const { count, orders } = await this.iexec.orderbook.fetchDatasetOrderbook(DATASET_ADDRESS);
      const datasetOrder = orders[0].order;
      const appOrderToSign = await this.iexec.order.createApporder({
        app: APP_ADDRESS,
        tag: ["tee", "scone"],
      });
      const appOrder = await this.iexec.order.signApporder(appOrderToSign, {
        preflightCheck: false,
      });

      const { orders: workerpoolOrders } = await this.iexec.orderbook.fetchWorkerpoolOrderbook({
        category,
        workerpool: "debug-v8-bellecour.main.pools.iexec.eth",
        minTag: ["tee", "scone"],
        maxTag: ["tee", "scone"],
      });
      const workerpoolOrder = workerpoolOrders && workerpoolOrders[0] && workerpoolOrders[0].order;
      if (!workerpoolOrder) throw Error(`no workerpoolorder found for category ${category}`);

      const userAddress = await this.iexec.wallet.getAddress();
      const key = generateKey(10);
      console.log("key", key);
      const value = JSON.stringify({ firstname, lastname, birthdate });
      await this.iexec.secrets.pushRequesterSecret(key, value, {
        teeFramework: "scone",
      });

      if (!(await this.iexec.storage.checkStorageTokenExists(userAddress))) {
        const token = await this.iexec.storage.defaultStorageLogin();
        const { isPushed } = await this.iexec.storage.pushStorageToken(token);
        console.log("default storage initialized:", isPushed);
      }

      const requestOrderToSign = await this.iexec.order.createRequestorder({
        app: APP_ADDRESS,
        appmaxprice: appOrder.appprice,
        dataset: DATASET_ADDRESS,
        workerpoolmaxprice: workerpoolOrder.workerpoolprice,
        requester: userAddress,
        volume: 1,
        tag: ["tee", "scone"],
        params: {
          iexec_secrets: { 1: key },
          iexec_result_storage_provider: "ipfs",
          iexec_result_storage_proxy: "https://result.v8-bellecour.iex.ec",
        },
        category: category,
      });

      const requestOrder = await this.iexec.order.signRequestorder(requestOrderToSign, {
        preflightCheck: false,
      });

      const { dealid } = await this.iexec.order.matchOrders(
        {
          apporder: appOrder,
          datasetorder: datasetOrder,
          requestorder: requestOrder,
          workerpoolorder: workerpoolOrder,
        },
        { preflightCheck: false }
      );
      console.log("DealId", dealid);
      return dealid;
    } catch (e) {
      console.warn("CAUGHT ERROR:", e);
    }
  }

  async updateDataset() {
    if (!this.iexec) {
      console.log("iexec not initiated yet");
      return;
    }

    const dbClient = await DatabaseController.getInstance();
    const parser = new Parser();
    const rows = await dbClient.getRows();
    await fs.promises.writeFile("./data/deployedDataset.csv", parser.parse(rows));

    try {
      const encryptionKey = this.iexec.dataset.generateEncryptionKey();
      const datasetFile = await fs.promises.readFile("./data/deployedDataset.csv"); //read dataset
      const encryptedDataset = await this.iexec.dataset.encrypt(datasetFile, encryptionKey);
      const encrypted_checksum = await this.iexec.dataset.computeEncryptedFileChecksum(
        encryptedDataset
      );

      console.log("encrypted checksum: " + encrypted_checksum);

      fs.writeFileSync("./data/tmp/binary", encryptedDataset);
      const client = new Web3Storage({ token: apiToken }); //create web3storage client to store file on ipfs
      const files = await getFilesFromPath("./data/tmp");

      const rootCid = await client.put(files, {
        name: "encrypted_dataset",
        maxRetries: 3,
        wrapWithDirectory: false,
      }); //upload file to ipfs, get CID
      console.log("put" + rootCid);

      const res = await client.get(rootCid); // Web3Response
      const web3files = await res!.files();
      const addr = web3files[0].cid;
      console.log(addr);

      const { address } = await this.iexec.dataset.deployDataset({
        owner: wallet.address,
        name: "encrypted dataset",
        multiaddr: "https://" + addr + ".ipfs.w3s.link",
        checksum: encrypted_checksum,
      });
      console.log("deployed at", address); //deploy encrypted dataset

      const pushed = await this.iexec.dataset.pushDatasetSecret(address, encryptionKey, {
        teeFramework: "scone",
      });
      console.log("secret pushed:", pushed); //push encryption key to SMS

      const datasetOrderToSign = await this.iexec.order.createDatasetorder({
        dataset: address,
        volume: 1000,
        tag: ["tee", "scone"],
      });

      const datasetOrder = await this.iexec.order.signDatasetorder(datasetOrderToSign, {
        preflightCheck: false,
      });

      const orderHash = await this.iexec.order.publishDatasetorder(datasetOrder);
      console.log("published order hash:", orderHash);
      return orderHash;
    } catch (e) {
      console.warn("CAUGHT ERROR:", e);
    }
  }

  async getDealObservable(dealId: string) {
    if (!this.iexec) {
      console.log("iexec not initiated yet");
      return;
    }
    const dealObservable = await this.iexec.deal.obsDeal(dealId);
    return dealObservable;
  }

  async showDeal(dealId: string) {
    const data = await this.iexec?.deal.show(dealId);
    console.log(data);
  }

  async getTaskIdFromDeal(dealId: string) {
    const taskId = await this.iexec?.deal.computeTaskId(dealId, 0);
    return taskId;
  }

  async checkTask(taskId: string) {
    await this.iexec?.deal.show("");
    const task = await this.iexec?.task.show(taskId);
    return task;
  }

  async getResult(dealId: string) {
    if (!this.iexec) {
      console.log("iexec not initiated yet");
      return;
    }
    const taskId = await this.getTaskIdFromDeal(dealId);
    if (!taskId) {
      console.log("No task id found");
      return;
    }
    const response = await this.iexec.task.fetchResults(taskId);
    const file = await response.blob();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const zip = new AdmZip(buffer);
    const resultText = zip.getEntry("result.txt")?.getData().toString();
    const results = resultText?.split("\n");
    return results;
  }
}

function generateKey(length: number) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
