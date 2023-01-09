export interface WalletType {
    Rpc: any;
    Utils: any;
    Account: any;
    chainId: any;
}

export interface RpcFee {
    MinTxFee: string;
    ValueStoreFee: string;
    DataStoreFee: string;
}

export interface ValueStore {}

export interface DataStore {
    DSLinker: any;
    Signature: string;
}

export interface RpcTxObject {
    Tx: any;
}

export interface Utxo {
    DataStores: Array<DataStore>;
    ValueStores: Array<ValueStore>;
    ValueStoreIDs: Array<string>;
    DataStoreIDs: Array<string>;
    Value: string | number | bigint;
    // TODO: Are these optional?
    VSPreImage?: VSPreImage;
    TxHash?: string;
    DSLinker?: any;
}

export interface Vin {}

export interface Vout {
    DataStore?: DataStore;
    ValueStore?: ValueStore;
}

export interface VSPreImage {
    ChainID: string;
    Value: string | number;
    TXOutIdx: string | number;
    Owner: string;
    Fee: string | number;
}

export interface DSPreImage {
    ChainID: string;
    TXOutIdx: string | number;
    Owner: string;
    Fee: string | number;
    Index: string;
    IssuedAt: string | number;
    Deposit: string | number;
    RawData: string;
    Value?: string;
}

export interface ASPreImage {
    ChainID: string;
    TXOutIdx: string | number;
    IssuedAt: string | number;
    Owner: string;
    Fee: string | number;
    Exp?: string | number;
    Value?: string | number;
}

export interface TxInOwner {
    address: string;
    txOutIdx: string;
    txHash: string;
    isDataStore: boolean;
}

export interface TxInPreImage {
    ChainID: string;
    ConsumedTxIdx: string;
    ConsumedTxHash: string;
}

export interface TxInLinker {
    TxHash: string;
    TXInPreImage: TxInPreImage;
}

export interface DSLinker {
    TxHash: string;
    DSPreImage: DSPreImage;
}

export interface FeeEstimates {
    baseFees: string;
    totalFees: string;
    costByVoutIdx: any[];
}

export interface Signature {
    Vin: Vin[];
    Vout: Vout[];
}
