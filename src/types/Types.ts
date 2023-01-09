export interface WalletType {
    rpc: any;
    utils: any;
    account: any;
    chainId: any;
}

export interface RpcFee {
    minTxFee: string;
    valueStoreFee: string;
    dataStoreFee: string;
}

export interface ValueStore {}

export interface DataStore {
    dSLinker: any;
    signature: string;
}

export interface RpcTxObject {
    tx: any;
}

export interface Utxo {
<<<<<<< HEAD
    DataStores: Array<DataStore>;
    ValueStores: Array<ValueStore>;
    ValueStoreIDs: Array<string>;
    DataStoreIDs: Array<string>;
    Value: string | number | bigint;
    // TODO: Are these optional?
    VSPreImage?: VSPreImage;
    TxHash?: string;
    DSLinker?: any;
=======
    dataStores: Array<DataStore>;
    valueStores: Array<ValueStore>;
    valueStoreIDs: Array<string>;
    dataStoreIDs: Array<string>;
    value: string | number | bigint;
    vSPreImage?: VSPreImage;
    txHash?: string;
    dSLinker?: any;
>>>>>>> begin-ts-conversion
}

export interface Vin {}

export interface Vout {
    dataStore?: DataStore;
    valueStore?: ValueStore;
}

export interface VSPreImage {
    chainID: string;
    value: string | number;
    tXOutIdx: string | number;
    owner: string;
    fee: string | number;
}

export interface DSPreImage {
    chainID: string;
    tXOutIdx: string | number;
    owner: string;
    fee: string | number;
    index: string;
    issuedAt: string | number;
    deposit: string | number;
    rawData: string;
    value?: string;
}

export interface ASPreImage {
    chainID: string;
    tXOutIdx: string | number;
    issuedAt: string | number;
    owner: string;
    fee: string | number;
    exp?: string | number;
    value?: string | number;
}

export interface TxInOwner {
    address: string;
    txOutIdx: string;
    txHash: string;
    isDataStore: boolean;
}

export interface TxInPreImage {
    chainID: string;
    consumedTxIdx: string;
    consumedTxHash: string;
}

export interface TxInLinker {
    txHash: string;
    tXInPreImage: TxInPreImage;
}

export interface DSLinker {
    txHash: string;
    dSPreImage: DSPreImage;
}

export interface FeeEstimates {
    baseFees: string;
    totalFees: string;
    costByVoutIdx: any[];
}

export interface Signature {
    vin: Vin[];
    vout: Vout[];
}
