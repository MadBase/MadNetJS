package main

import (
	"encoding/hex"
	"errors"
	"math/big"

	"github.com/MadBase/MadNet/crypto/bn256/cloudflare"
	"github.com/gopherjs/gopherjs/js"
	"github.com/miratronix/jopher"
)

func main() {
	// Web
	/*
		js.Global.Set("Sign", jopher.Promisify(Sign))
		js.Global.Set("Verify", jopher.Promisify(Verify))
		js.Global.Set("GetPubK", jopher.Promisify(GetPubK))
		js.Global.Set("PubFromSig", jopher.Promisify(PubFromSig))
	*/
	// Node.js
	js.Module.Get("exports").Set("Sign", jopher.Promisify(Sign))
	js.Module.Get("exports").Set("AggregateSign", jopher.Promisify(AggregateSign))
	js.Module.Get("exports").Set("AggregateSignatures", jopher.Promisify(AggregateSignatures))
	js.Module.Get("exports").Set("Verify", jopher.Promisify(Verify))
	js.Module.Get("exports").Set("AggregateVerifySingle", jopher.Promisify(AggregateVerifySingle))
	js.Module.Get("exports").Set("GetPubK", jopher.Promisify(GetPubK))
	js.Module.Get("exports").Set("PubFromSig", jopher.Promisify(PubFromSig))
	js.Module.Get("exports").Set("AggregatePublicKeys", jopher.Promisify(AggregatePublicKeys))
}

/*
	Cloudflare Sign wrapper
	TODO: Investigate why map is required for argument in this function
		Assigning `(msg string, privK string)` results in:
		`reflect: Call using map[string]interface {} as type string`
		NOTE: This only occurs for the Node.js export and not web export js.Global
*/

func Sign(msg string, privK string) (string, error) {
	if msg == "" || privK == "" {
		return "", errors.New("Missing arg.")
	}
	msgBytes, err := hex.DecodeString(msg)
	if err != nil {
		return "", err
	}
	privBytes, ok := new(big.Int).SetString(privK, 16)
	if !ok {
		return "", errors.New("unable to set hex string for privK")
	}
	pubK := new(cloudflare.G2).ScalarBaseMult(privBytes)
	pubkbytes := pubK.Marshal()

	nmsg := []byte{}
	nmsg = append(nmsg, pubkbytes...)
	nmsg = append(nmsg, msgBytes...)

	sigpoint, err := cloudflare.Sign(nmsg, privBytes, cloudflare.HashToG1)
	if err != nil {
		return "", err
	}
	marshalSig, err := cloudflare.MarshalSignature(sigpoint, pubK)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(marshalSig), nil
}

func AggregateSign(msg string, groupPubKey string, privK string) (string, error) {
	msgBytes, err := hex.DecodeString(msg)
	if err != nil {
		return "", err
	}
	privBytes, ok := new(big.Int).SetString(privK, 16)
	if !ok {
		return "", errors.New("unable to set hex string for privK")
	}
	pubK := new(cloudflare.G2).ScalarBaseMult(privBytes)

	groupPubKeyBytes, err := hex.DecodeString(groupPubKey)
	if err != nil {
		return "", err
	}
	nmsg := []byte{}
	nmsg = append(nmsg, groupPubKeyBytes...)
	nmsg = append(nmsg, msgBytes...)

	sigpoint, err := cloudflare.Sign(nmsg, privBytes, cloudflare.HashToG1)
	if err != nil {
		return "", err
	}
	marshalSig, err := cloudflare.MarshalSignature(sigpoint, pubK)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(marshalSig), nil
}

func AggregateSignatures(signatures []interface{}) (string, error) {
	sigs := make([]string, len(signatures))
	for i, v := range signatures {
		sigs[i] = v.(string)
	}

	sigAgg := new(cloudflare.G1)
	pubKAgg := new(cloudflare.G2)
	if len(sigs) == 0 {
		return "", errors.New("Signature length 0")
	}

	for i := 0; i < len(sigs); i++ {
		sigBytes, err := hex.DecodeString(sigs[i])
		if err != nil {
			return "", err
		}
		pubkey, signature, err := cloudflare.UnmarshalSignature(sigBytes)
		if err != nil {
			return "", err
		}
		sigAgg.Add(sigAgg, signature)
		pubKAgg.Add(pubKAgg, pubkey)
	}
	marshalSig, err := cloudflare.MarshalSignature(sigAgg, pubKAgg)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(marshalSig), nil
}

// Verify signature of a message
func Verify(msg string, sig string) (string, error) {
	msgBytes, err := hex.DecodeString(msg)
	if err != nil {
		return "", err
	}
	sigBytes, err := hex.DecodeString(sig)
	if err != nil {
		return "", err
	}
	pubkey, signature, err := cloudflare.UnmarshalSignature(sigBytes)
	if err != nil {
		return "", err
	}
	pubKeyBytes := pubkey.Marshal()
	nmsg := []byte{}
	nmsg = append(nmsg, pubKeyBytes...)
	nmsg = append(nmsg, msgBytes...)
	ok, err := cloudflare.Verify(nmsg, signature, pubkey, cloudflare.HashToG1)
	if err != nil {
		return "", err
	}
	if !ok {
		return "", errors.New("Invalid signature")
	}
	return hex.EncodeToString(pubKeyBytes), nil
}

func AggregateVerifySingle(msg string, groupPubKey string, sig string) (string, error) {
	msgBytes, err := hex.DecodeString(msg)
	if err != nil {
		return "", err
	}
	sigBytes, err := hex.DecodeString(sig)
	if err != nil {
		return "", err
	}
	pubkey, signature, err := cloudflare.UnmarshalSignature(sigBytes)
	if err != nil {
		return "", err
	}
	pubKeyBytes := pubkey.Marshal()
	groupPubKeyBytes, err := hex.DecodeString(groupPubKey)
	if err != nil {
		return "", err
	}
	nmsg := []byte{}
	nmsg = append(nmsg, groupPubKeyBytes...)
	nmsg = append(nmsg, msgBytes...)

	ok, err := cloudflare.Verify(nmsg, signature, pubkey, cloudflare.HashToG1)
	if err != nil {
		return "", err
	}
	if !ok {
		return "", errors.New("Invalid signature")
	}
	return hex.EncodeToString(pubKeyBytes), nil
}

// Public key from private key
func GetPubK(privK string) (string, error) {
	privKInt, ok := new(big.Int).SetString(privK, 16)
	if !ok {
		return "", errors.New("unable to set hex string for privK")
	}
	pubK := new(cloudflare.G2).ScalarBaseMult(privKInt)
	return hex.EncodeToString(pubK.Marshal()), nil
}

// Public key from signature
// Used to compare signature from Verify
func PubFromSig(sig string) (string, error) {
	sigBytes, err := hex.DecodeString(sig)
	if err != nil {
		return "", err
	}
	pubkey, _, err := cloudflare.UnmarshalSignature(sigBytes)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(pubkey.Marshal()), nil
}

func AggregatePublicKeys(pKeys []interface{}) (string, error) {
	pubKeys := make([]string, len(pKeys))
	for i, v := range pKeys {
		pubKeys[i] = v.(string)
	}
	pubKAgg := new(cloudflare.G2)
	if len(pubKeys) == 0 {
		return "", errors.New("Signature length 0")
	}
	for i := 0; i < len(pubKeys); i++ {
		pubKBytes, err := hex.DecodeString(pubKeys[i])
		if err != nil {
			return "", err
		}
		pubKNew := new(cloudflare.G2)
		_, err = pubKNew.Unmarshal(pubKBytes)
		if err != nil {
			return "", err
		}
		pubKAgg.Add(pubKAgg, pubKNew)
	}
	pubKAggBytes := pubKAgg.Marshal()
	return hex.EncodeToString(pubKAggBytes), nil
}
