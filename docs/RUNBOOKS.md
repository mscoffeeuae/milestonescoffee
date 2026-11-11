# Runbooks — Milestones Coffee 2.0

**Status:** Placeholder structure. Detailed procedures to be completed in Prompts 8 and 12.

---

## Purpose

Runbooks provide step-by-step procedures for operational tasks that must be executed correctly without time to reason from first principles. Each runbook must be tested before it is marked ready.

---

## Runbook index

| Runbook | Status | Completed in |
|---|---|---|
| R-01 Application deployment | 🔲 Placeholder | Prompt 12 |
| R-02 Database backup and restore | 🔲 Placeholder | Prompt 12 |
| R-03 Payment reconciliation | 🔲 Placeholder | Prompt 7 |
| R-04 Failed order dispatch recovery | 🔲 Placeholder | Prompt 8 |
| R-05 Refund processing | 🔲 Placeholder | Prompt 7 |
| R-06 Customer account recovery | 🔲 Placeholder | Prompt 9 |
| R-07 Vendor outage response | 🔲 Placeholder | Prompt 8 |
| R-08 Feature flag management | 🔲 Placeholder | Prompt 2 |
| R-09 Rollback procedure | 🔲 Placeholder | Prompt 12 |
| R-10 Security incident response | 🔲 Placeholder | Prompt 12 |
| R-11 Branch staff onboarding | 🔲 Placeholder | Prompt 8 |

---

## R-01 Application deployment (placeholder)

**Trigger:** Scheduled release, hotfix, feature flag change  
**Owner:** Engineering  
**Procedure:** To be completed in Prompt 12  
**Pre-conditions:** CI passed; staging validated; migrations reviewed  

---

## R-02 Database backup and restore (placeholder)

**Trigger:** Data recovery, disaster, corruption  
**Owner:** Engineering  
**RPO target:** ≤ 15 minutes (proposed; subject to hosting capability)  
**RTO target:** ≤ 4 hours (proposed; subject to hosting capability)  
**Procedure:** To be completed in Prompt 12  
**Verification:** Timed restore drill must be documented and rehearsed before production launch  

---

## R-03 Payment reconciliation (placeholder)

**Trigger:** Daily; on payment mismatch alert  
**Owner:** Finance  
**Procedure:** To be completed in Prompt 7  
**Key questions to answer:**
- How to identify a captured payment with no matching order?
- How to identify an order with no payment captured?
- How to identify duplicate captures?
- Safe retry path vs. manual resolution path  

---

## R-04 Failed order dispatch recovery (placeholder)

**Trigger:** POS dispatch failure alert; order stuck in CONFIRMED  
**Owner:** Operations  
**Procedure:** To be completed in Prompt 8  
**Key principle:** Branch staff must have a safe manual path that does not require platform access to operate  

---

## R-05 Refund processing (placeholder)

**Trigger:** Customer request; order recovery  
**Owner:** Finance (approval) + Engineering (execution)  
**Procedure:** To be completed in Prompt 7  
**Key principles:**
- Refund only after provider payment confirmed
- Record reason and actor
- Notify customer
- Reverse loyalty points under approved policy (once only)  

---

## R-06 Customer account recovery (placeholder)

**Trigger:** Customer reports access issue, lost device  
**Owner:** Operations / Customer Support  
**Procedure:** To be completed in Prompt 9  
**Key principles:**
- Verify customer identity before account access
- Never expose personal data to unverified requestor
- Recovery through identity provider flow preferred  

---

## R-07 Vendor outage response (placeholder)

**Trigger:** POS unavailable; payment gateway degraded; identity provider down  
**Owner:** Engineering (detection) + Operations (response)  
**Procedure:** To be completed in Prompt 8  
**Key principles:**
- Feature flag disables ordering if POS unavailable and fallback not approved
- Payment gateway degradation: surface clear error to customer; do not retry financial charges blindly
- Identity provider down: existing sessions continue; new logins degrade gracefully  

---

## R-08 Feature flag management (placeholder)

**Trigger:** New branch pilot; rollback; Phase activation  
**Owner:** Engineering  
**Procedure:** To be completed in Prompt 2 (flag infrastructure) and Prompt 12 (operational use)  

---

## R-09 Rollback procedure (placeholder)

**Trigger:** Serious defect discovered post-deployment  
**Owner:** Engineering  
**Procedure:** To be completed in Prompt 12  
**Key principles:**
- Financial records preserved during rollback
- Use feature flags first (fastest rollback)
- Code rollback: compatible migrations only
- If rollback would lose data: forward repair instead  

---

## R-10 Security incident response (placeholder)

**Trigger:** Suspected breach, unauthorized access, suspicious payment activity  
**Owner:** Engineering + Privacy reviewer  
**Procedure:** To be completed in Prompt 12  
**Key steps (sketch):**
1. Isolate affected component
2. Preserve logs and evidence (do not delete)
3. Notify privacy/legal reviewer immediately
4. Assess data exposure scope
5. Notify affected users per legal requirements
6. Remediate
7. Post-incident review  

---

## R-11 Branch staff onboarding (placeholder)

**Trigger:** New branch pilot enrollment; staff turnover  
**Owner:** Operations  
**Procedure:** To be completed in Prompt 8  
**Key training points:**
- Difference between PAID, ACCEPTED and READY states
- How to safely locate an order without exposing customer data
- What to do when POS is unavailable
- How to use the staff fallback order management dashboard  

---

*All runbooks must be reviewed and signed off by their named owners before production launch.*
