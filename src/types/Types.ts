export interface WalletType {
    Rpc: any;
    Utils: any;
    Account: any;
}

export interface RpcFee {
    MinTxFee: string;
    ValueStoreFee: string;
    DataStoreFee: string;
}

export interface ValueStore {
}

export interface DataStore {
}

export interface Utxo {
    DataStore: Array<DataStore>;
    ValueStore: Array<ValueStore>;
    ValueStoreIDs: Array<string>;
    DataStoreIDs: Array<string>;
    Value: string | number | bigint;
    VSPreImage:any;
    TxHash:string;
    DSLinker: any;
}
