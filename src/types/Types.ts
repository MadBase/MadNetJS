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
    dsLinker: any;
    signature: string;
}

export interface Utxo {
    dataStores: Array<DataStore>;
    valueStores: Array<ValueStore>;
    valueStoreIDs: Array<string>;
    dataStoreIDs: Array<string>;
    value: string | number | bigint;
    vsPreImage?: VsPreImage;
    txHash?: string;
    dsLinker?: any;
}

export interface Vin {}

export interface Vout {
    dataStore?: DataStore;
    valueStore?: ValueStore;
}

export interface VsPreImage {
    chainID: string;
    value: string | number;
    txOutIdx: string | number;
    owner: string;
    fee: string | number;
}

export interface DsPreImage {
    chainID: string;
    txOutIdx: string | number;
    owner: string;
    fee: string | number;
    index: string;
    issuedAt: string | number;
    deposit: string | number;
    rawData: string;
    value?: string;
}

export interface AsPreImage {
    chainID: string;
    txOutIdx: string | number;
    issuedAt: string | number;
    owner: string;
    fee: string | number;
    exp?: string | number;
    value?: string | number;
}

export interface TxInOwner {
    address: string;
    txOutIdx: string | number;
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
    txInPreImage: TxInPreImage;
}

export interface DSLinker {
    txHash: string;
    dsPreImage: DsPreImage;
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

/**
 * A collection of utilities for AliceNetJS
 * @param { Object } Eth - A collection of Eth Utility Functions
 * @param { Object } Generic - A collection of Generic Utility Functions
 * @param { Object } Hash - A collection of Hash Utility Functions
 * @param { Object } String - A collection of String Utility Functions
 * @param { Object } Tx - A collection of Tx Utility Functions
 * @param { Object } Validator - A collection of Validating Utility Functions
 * @param { Object } VerifySignature - A collection of Signature Validation Functions
 * @param { Object } Faucet - A collection of Faucet Utility Functions
 *
*/
export interface UtilityCollection {
    Eth: Object,
    Generic: Object,
    Hash: Object,
    String: Object,
    Tx: Object,
    Validator: Object,
    VerifySignature: Object,
    Faucet: Object
}

//////////////
/** Types **/
/////////////

/**  Curve for an AliceNetAccount: 1 (secp256k1) OR 2 (bn) */
export type AccountCurve = string;

/** A 256bit keccask 256 hash string */
export type Keccak256Hash = string;

/** Length ambiguous hexadecimal data */
export type HexData = string;

/** A 256bit private key represented as a string */
export type PrivateKeyString = string;

/** 20 Byte EVM Standard Public Address */
export type PublicAddress = string;

/** 128 bit hexadecimal string prepresnetation of a public key */
export type PublicKey = string;

/** An array of uint256(64 byte) strings */
export type Uint256Array = string[];

