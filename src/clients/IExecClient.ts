import { IExec, utils } from "iexec";
import { ConsumableApporder, ConsumableWorkerpoolorder } from "iexec/IExecOrderModule";
import { Wallet } from "ethers";
import IExecWallet from "../wallet.json" assert { type: "json" };
import AdmZip from "adm-zip";
import { Web3Storage, getFilesFromPath } from "web3.storage";
import * as fs from "fs";
import { Parser } from "json2csv";
import { DatabaseClient } from "./DatabaseClient.ts";
import { Passenger, DealProgress } from "../types.ts";

const wallet = JSON.stringify(IExecWallet);
const tag = ["tee", "gramine"];
const category = 0;
const host = "bellecour";
const workerpool = "debug-v8-bellecour.main.pools.iexec.eth";
const orderOptions = { preflightCheck: false };
const secretOptions = { teeFramework: "gramine" } as const;
const requestParams = {
    iexec_result_storage_provider: "ipfs",
    iexec_result_storage_proxy: "https://result.v8-bellecour.iex.ec",
};
const sconeTag = ["tee", "scone"];
const sconeSMS = { smsURL: "https://sms.scone-debug.v8-bellecour.iex.ec" };
const sconeSceretOptions = { teeFramework: "scone" } as const;
const datasetFilename = "./data/deployedDataset.csv";
const encryptedDatasetPath = "./data/tmp";

export class GramineClient {
    private iexec?: IExec;
    private static instance: GramineClient;

    static async getInstance(): Promise<GramineClient> {
        if (!GramineClient.instance) {
            GramineClient.instance = new GramineClient();
            await GramineClient.instance.init();
        }
        return GramineClient.instance;
    }

    private async init() {
        const password = process.env.IEXEC_WALLET_PASSWORD!;
        const { privateKey } = await Wallet.fromEncryptedJson(wallet, password);
        const signer = utils.getSignerFromPrivateKey(host, privateKey);
        this.iexec = new IExec({ ethProvider: signer });
    }

    async order(passengers: Passenger[]) {
        try {
            if (!this.iexec) throw Error("iexec not initiated yet");
            const apporder = await this.getAppOrder();
            const workerpoolorder = await this.getWorkerpoolOrder();
            await this.initStorage();
            const argKey = await this.pushSecret(passengers);
            const statusKey = generateKey(10);
            const reportAddress = process.env.STAGING_URL ? `${process.env.STAGING_URL}/saveStatus` : "";
            const urlKey = await this.pushSecret({
                reportAddress,
                statusKey,
                apiKey: process.env.STATUS_API_KEY || "",
            });
            const requestorder = await this.getRequestOrder(apporder, workerpoolorder, [argKey, urlKey]);
            const { dealid } = await this.iexec.order.matchOrders(
                {
                    apporder,
                    requestorder,
                    workerpoolorder,
                },
                orderOptions
            );
            const status = DealStatus.getInstance();
            status.status[statusKey] = {
                dealId: dealid,
                tasksCount: 0,
                tasksDone: 0,
            };
            console.log(status.status[statusKey]);
            return statusKey;
        } catch (e) {
            console.warn("CAUGHT ERROR:", e);
        }
    }

    private async getAppOrder() {
        if (!this.iexec) throw Error("iexec not initiated yet");
        const app = process.env.IEXEC_APP!;
        const appOrderToSign = await this.iexec.order.createApporder({
            app,
            tag,
        });
        const appOrder = await this.iexec.order.signApporder(appOrderToSign, orderOptions);
        return appOrder;
    }

    private async getWorkerpoolOrder() {
        if (!this.iexec) throw Error("iexec not initiated yet");
        const { orders: workerpoolOrders } = await this.iexec.orderbook.fetchWorkerpoolOrderbook({
            category,
            workerpool,
            minTag: tag,
            maxTag: tag,
        });
        const workerpoolOrder = workerpoolOrders && workerpoolOrders[0] && workerpoolOrders[0].order;
        if (!workerpoolOrder) throw Error(`no workerpoolorder found for category ${category}`);
        return workerpoolOrder;
    }

    private async getRequestOrder(apporder: ConsumableApporder, workerpoolorder: ConsumableWorkerpoolorder, secretKeys: string[]) {
        if (!this.iexec) throw Error("iexec not initiated yet");
        const requester = await this.iexec.wallet.getAddress();
        const secrets = secretKeys.reduce((acc, key, index) => {
            acc[index + 1] = key;
            return acc;
        }, {} as Record<number, string>);
        const app = process.env.IEXEC_APP!;
        const requestOrderToSign = await this.iexec.order.createRequestorder({
            app,
            appmaxprice: apporder.appprice,
            workerpoolmaxprice: workerpoolorder.workerpoolprice,
            requester,
            volume: 1,
            tag,
            params: {
                iexec_secrets: secrets,
                ...requestParams,
            },
            category,
        });
        const requestorder = await this.iexec.order.signRequestorder(requestOrderToSign, orderOptions);
        return requestorder;
    }

    private async initStorage() {
        if (!this.iexec) throw Error("iexec not initiated yet");
        const userAddress = await this.iexec.wallet.getAddress();
        if (!(await this.iexec.storage.checkStorageTokenExists(userAddress))) {
            const token = await this.iexec.storage.defaultStorageLogin();
            await this.iexec.storage.pushStorageToken(token);
        }
    }

    private async pushSecret(data: any) {
        if (!this.iexec) throw Error("iexec not initiated yet");
        const key = generateKey(10);
        const value = JSON.stringify(data);
        await this.iexec.secrets.pushRequesterSecret(key, value, secretOptions);
        return key;
    }

    async getDealObservable(dealId: string) {
        if (!this.iexec) throw Error("iexec not initiated yet");
        const dealObservable = await this.iexec.deal.obsDeal(dealId);
        return dealObservable;
    }

    async getTaskIdFromDeal(dealId: string) {
        if (!this.iexec) throw Error("iexec not initiated yet");
        const taskId = await this.iexec?.deal.computeTaskId(dealId, 0);
        return taskId;
    }

    async getResult(dealId: string) {
        if (!this.iexec) throw Error("iexec not initiated yet");

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

export class SconeClient {
    private static instance: SconeClient;
    private iexec?: IExec;

    static async getInstance(): Promise<SconeClient> {
        if (!SconeClient.instance) {
            SconeClient.instance = new SconeClient();
            await SconeClient.instance.init();
        }
        return SconeClient.instance;
    }

    private async init() {
        const password = process.env.IEXEC_WALLET_PASSWORD!;
        const { privateKey } = await Wallet.fromEncryptedJson(wallet, password);
        const signer = utils.getSignerFromPrivateKey(host, privateKey);
        this.iexec = new IExec({ ethProvider: signer }, sconeSMS);
    }

    async updateDataset() {
        if (!this.iexec) throw Error("iexec not initiated yet");
        await this.writeDataset();

        try {
            const [checksum, encryptionKey] = await this.encryptDataset();
            const cid = await this.pushDataset();
            const owner = await this.iexec.wallet.getAddress();
            const { address } = await this.iexec.dataset.deployDataset({
                owner,
                name: "encrypted dataset",
                multiaddr: `https://${cid}.ipfs.w3s.link`,
                checksum,
            });
            console.log("deployed dataset at", address);

            await this.iexec.dataset.pushDatasetSecret(address, encryptionKey, sconeSceretOptions);
            const appWallet = process.env.IEXEC_APP_WALLET!; //TODO: update in .env
            const datasetOrderToSign = await this.iexec.order.createDatasetorder({
                dataset: address,
                volume: 1000,
                tag: sconeTag,
                requesterrestrict: appWallet,
            });
            const datasetOrder = await this.iexec.order.signDatasetorder(datasetOrderToSign, orderOptions);
            const orderHash = await this.iexec.order.publishDatasetorder(datasetOrder);
            console.log("Order hash of published dataset:", orderHash);
            return orderHash;
        } catch (e) {
            console.warn("CAUGHT ERROR:", e);
        }
    }

    private async writeDataset() {
        const dbClient = await DatabaseClient.getInstance();
        const parser = new Parser();
        const rows = await dbClient.getRows();
        await fs.promises.writeFile(datasetFilename, parser.parse(rows));
    }

    private async encryptDataset() {
        if (!this.iexec) throw Error("iexec not initiated yet");
        const encryptionKey = this.iexec.dataset.generateEncryptionKey();
        const datasetFile = await fs.promises.readFile(datasetFilename);
        const encryptedDataset = await this.iexec.dataset.encrypt(datasetFile, encryptionKey);
        const checksum = await this.iexec.dataset.computeEncryptedFileChecksum(encryptedDataset);
        console.log("dataset checksum: ", checksum);
        fs.writeFileSync(encryptedDatasetPath + "/binary", encryptedDataset);
        return [checksum, encryptionKey];
    }

    private async pushDataset() {
        const storageToken = process.env.WEB3STORAGE_TOKEN!;
        const client = new Web3Storage({ token: storageToken });
        const files = await getFilesFromPath(encryptedDatasetPath);
        const rootCid = await client.put(files, {
            name: "encrypted_dataset",
            maxRetries: 3,
            wrapWithDirectory: false,
        });
        const res = await client.get(rootCid);
        const web3files = await res!.files();
        return web3files[0].cid;
    }
}

export class DealStatus {
    private static instance: DealStatus;

    status: { [statusKey: string]: DealProgress } = {};

    static getInstance(): DealStatus {
        if (!DealStatus.instance) {
            DealStatus.instance = new DealStatus();
        }
        return DealStatus.instance;
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
