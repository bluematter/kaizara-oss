# Chart Notes System - Compliance Notes

## Current Implementation Status

### What's Built (EHR Industry Standard)

| Feature | Status | Notes |
|---------|--------|-------|
| SOAP Charting | ✅ | Subjective, Objective, Assessment, Plan sections |
| Sign Workflow | ✅ | DRAFT → UNSIGNED → PENDING_COSIGN → SIGNED → AMENDED |
| Co-signature Support | ✅ | For mid-levels (NP, PA) requiring supervising physician |
| Provider Attestation | ✅ | 3 checkbox attestations before signing |
| Timestamp Capture | ✅ | signedAt, coSignedAt stored |
| Signer Identity | ✅ | signedById, coSignedById linked to User |
| Audit Logging | ✅ | All sign/cosign/amend events logged |
| Amendment System | ✅ | Preserves original in JSON, requires reason |
| RBAC Permissions | ✅ | encounters:sign, encounters:cosign, encounters:amend |
| Lock After Signing | ✅ | Signed encounters are read-only |
| Self-Cosign Prevention | ✅ | Cannot co-sign your own encounter |

### Clinical Data Sidebar (PAMI+)

| Data Type | Status | Notes |
|-----------|--------|-------|
| Allergies | ✅ | With severity levels |
| Medications | ✅ | Name, dosage, frequency |
| Diagnoses | ✅ | ICD-10 codes, primary/secondary |
| Supplements | ✅ | Important for naturopathic/integrative |
| Vitals | ✅ | Weight, BP, HR |
| Injections | ✅ | With lot tracking - critical for peptide clinics |

---

## Future Enhancements (If Needed)

### 1. Re-authentication at Signing
**Requirement:** 21 CFR Part 11 (FDA) compliance
**What:** Require password re-entry before signing
**When Needed:** Clinical trials, pharmaceutical contexts, or if required by state board

```typescript
// Example: Add to SignDialog
const [password, setPassword] = useState("");
const verifyPassword = async () => {
  // Call API to verify current user's password
  const valid = await verifyUserPassword(password);
  if (valid) await onSign();
};
```

### 2. Attestation Text Customization
**Requirement:** State-specific legal language
**What:** Allow clinic to customize attestation checkbox text
**When Needed:** If state medical board requires specific wording

### 3. Digital Signature Certificates (PKI)
**Requirement:** Highest compliance tier
**What:** Cryptographic signatures using certificates
**When Needed:** Hospital systems, Joint Commission accreditation

### 4. Signature Image Capture
**Requirement:** Visual signature on record
**What:** Canvas-based signature drawing
**When Needed:** If payers or auditors request visual signatures

### 5. Timely Signing Alerts
**Requirement:** Operational compliance
**What:** Dashboard alerts for unsigned notes > X days
**When Needed:** Quality assurance, billing compliance

### 6. Addendum vs Amendment
**Requirement:** Some orgs distinguish these
**What:** Addendum = additional info, Amendment = correction
**When Needed:** If clinic policy requires distinction

---

## Compliance Level Assessment

| Clinic Type | Current System | Notes |
|-------------|----------------|-------|
| Cash-pay wellness/longevity | ✅ Sufficient | No insurance audits |
| Naturopathic practice | ✅ Sufficient | Supplements + injections covered |
| Peptide therapy clinic | ✅ Sufficient | Lot tracking included |
| Insurance-billing clinic | ✅ Sufficient | Standard SOAP + signing |
| Hospital/health system | ⚠️ May need PKI | Joint Commission requirements |
| Clinical trials | ⚠️ Needs 21 CFR Part 11 | Re-auth + audit enhancement |

---

## References

- HIPAA Security Rule: 45 CFR 164.312
- 21 CFR Part 11: FDA Electronic Records/Signatures
- CMS Documentation Guidelines
- State Medical Board requirements (vary by state)
