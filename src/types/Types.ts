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

export interface ValueStore {
}

export interface DataStore {
    DSLinker: any;
    Signature: string;
}

export interface RpcTxObject {
    Tx: any;
}

export interface Utxo {
    DataStore: Array<DataStore>;
    ValueStore: Array<ValueStore>;
    ValueStoreIDs: Array<string>;
    DataStoreIDs: Array<string>;
    Value: string | number | bigint;
    VSPreImage: VSPreImage;
    TxHash:string;
    DSLinker: any;
}

export interface Vin {
}

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
    TXInPreImage: TxInPreImage
}

export interface DSLinker {
    TxHash: string;
    DSPreImage: DSPreImage
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

