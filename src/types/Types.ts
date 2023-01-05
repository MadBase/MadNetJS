// TODO Update any types after https://github.com/alicenet/alicenetjs/pull/90
export interface Utxo {
    DataStores: Array<any>;
    ValueStores: Array<any>;
    ValueStoreIDs: Array<any>;
    DataStoreIDs: Array<any>;
    Value: string | number | bigint;
}
