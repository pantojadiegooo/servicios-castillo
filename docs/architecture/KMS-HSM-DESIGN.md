# Castle Gate — Enterprise KMS / HSM Signing Architecture Design

> **Document Classification**: Architecture Blueprint & Migration Plan (Phase 6 Block 3)  
> **Status**: APPROVED DESIGN BLUEPRINT (NON-CODE / FOR FUTURE ENTERPRISE DEMAND)  
> **Target Cloud Providers**: AWS KMS, Google Cloud KMS, HashiCorp Vault (Transit Engine)  

---

## 1. Executive Summary & Objective

In high-compliance enterprise environments (e.g., FIPS 140-2 Level 3 / Level 4 regulated financial institutions), storing Ed25519 private keys as local PEM files on filesystem or CI/CD runner memory is prohibited.

This blueprint specifies the architecture to offload signing operations from local Node.js `crypto.sign()` to Hardware Security Modules (HSMs) and managed Key Management Services (KMS), while maintaining:
1. Exact canonical RFC 8785 JCS payload hashing.
2. Complete backwards-compatibility with `castle-verify.js` and third-party verifiers (`cosign`).
3. Mathematical immutability and historical verifiability across key rotations.

---

## 2. Abstraction Layer Architecture

```mermaid
flowchart TD
    A["Release Authorizer (rawCertificateData)"] --> B["RFC 8785 Canonicalizer (JCS)"]
    B --> C["SHA-256 Digest (32 bytes)"]
    C --> D{"Signing Provider Strategy"}
    D -->|Local Mode (Default)| E["Local Ed25519 Private Key (.pem)"]
    D -->|AWS KMS Mode| F["AWS KMS: Sign(KeyId, Message, ED25519_SHA_512)"]
    D -->|GCP KMS Mode| G["GCP Cloud KMS: asymmetricSign(KeyVersion, Digest)"]
    D -->|Vault Mode| H["HashiCorp Vault: /transit/sign/castle-gate-key"]
    E --> I["Base64 Signature + Key ID"]
    F --> I
    G --> I
    H --> I
    I --> J["Release Certificate Envelope (Integrity Block)"]
```

### Interface Contract (`ISignerProvider`):
```typescript
interface ISignerProvider {
  /**
   * Returns the stable public key identifier (Key ID)
   */
  getKeyId(): Promise<string>;

  /**
   * Exports the public key in PEM format for certificate embedding
   */
  getPublicKeyPem(): Promise<string>;

  /**
   * Cryptographically signs canonical raw payload or digest using HSM
   */
  sign(canonicalPayloadBuffer: Buffer): Promise<{
    signatureBase64: string;
    keyId: string;
    algorithm: 'ed25519' | 'ecdsa-p256' | 'rsa-pss-4096';
  }>;
}
```

---

## 3. Cloud Provider Integration Details

### 3.1. AWS KMS (`AwsKmsSigner`)
- **Key Type**: Asymmetric Signing Key (`ECC_NIST_ED25519` or `RSA_4096`).
- **AWS API Call**: `kmsClient.send(new SignCommand({ KeyId, Message, MessageType: 'RAW', SigningAlgorithm: 'ED25519_SHA_512' }))`.
- **Identity & Access**: IAM Role with `kms:Sign` and `kms:GetPublicKey` granted strictly to the CI/CD execution principal (e.g. GitHub Actions OIDC IAM Role).

### 3.2. Google Cloud KMS (`GcpKmsSigner`)
- **Key Type**: Cloud HSM (`EC_SIGN_ED25519` / `EC_SIGN_P256_SHA256`).
- **Google API Call**: `kmsClient.asymmetricSign({ name: keyVersionName, digest: { sha256: digestBuffer } })`.
- **Identity & Access**: Workload Identity Federation binding GitHub Actions repository claims to GCP Service Account.

### 3.3. HashiCorp Vault (`VaultTransitSigner`)
- **Engine**: Transit Secrets Engine (`/transit`).
- **API Endpoint**: `POST /v1/transit/sign/castle-release-gate`.
- **Payload**: `{ "input": base64(canonicalString), "hash_algorithm": "sha2-256" }`.

---

## 4. Key Rotation & Historical Verifiability

A fundamental invariant of Castle Gate is that **a release certificate issued in year $N$ must remain verifiable in year $N+10$, even if the signing key has been rotated or retired**.

### Rotation Lifecycle:
1. **Key Versioning in Certificate**:
   - Every certificate embeds:
     ```json
     "integrity": {
       "pki_signature_extension": {
         "key_id": "kms:aws:us-east-1:123456789:key/abcd-1234:version/2",
         "public_key_pem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
         "signature_base64": "..."
       }
     }
     ```
2. **Offline Self-Containment**:
   - Because the certificate embeds the public key corresponding to the exact version used at issuance time, `castle-verify.js` can verify the signature mathematically without connecting to the KMS.
3. **KMS Revocation / Trust Anchor Registry**:
   - In enterprise deployment, a root Trust Anchor catalog lists active vs retired key IDs. Rotating a key marks Version 1 as `RETIRED_FOR_SIGNING_VALID_FOR_VERIFICATION`, preventing retroactive compromise while preserving historical verification.
