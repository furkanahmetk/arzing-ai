use odra::prelude::*;

/// A single audit record stored on-chain.
#[odra::odra_type]
pub struct AuditRecord {
    pub contract_target: String,
    pub risk_score: u8,
    pub summary: String,
    pub findings_critical: u8,
    pub findings_high: u8,
    pub findings_medium: u8,
    pub findings_low: u8,
    pub audited_at_ms: u64,
    pub audit_date: String,
    pub submitted_by: Address,
}

/// Custom error codes.
/// User(0) = NotAuthorized — this was the root cause error we were hitting
/// when the agent was not registered via set_agent.
#[odra::odra_error]
pub enum Error {
    NotAuthorized = 0,
    NotOwner = 1,
    AgentNotSet = 2,
    NotInitialized = 3,
}

/// The AuditRegistry contract state module.
#[odra::module]
pub struct AuditRegistry {
    records: Mapping<String, AuditRecord>,
    count: Var<u32>,
    agent: Var<Address>,
    owner: Var<Address>,
}

#[odra::module]
impl AuditRegistry {
    /// Constructor: Sets the deployer as the owner of this registry.
    #[odra(init)]
    pub fn init(&mut self) {
        self.owner.set(self.env().caller());
        self.count.set(0);
    }

    /// Assigns a new authorized agent. Only the contract owner can call this.
    /// This must be called once after deployment to authorize the backend agent key.
    pub fn set_agent(&mut self, new_agent: Address) {
        let caller = self.env().caller();
        let owner = self.owner.get_or_revert_with(Error::NotInitialized);
        if caller != owner {
            self.env().revert(Error::NotOwner);
        }
        self.agent.set(new_agent);
    }

    /// Writes an audit record on-chain.
    /// Only the authorized agent or the owner can call this.
    /// Reverts with User(0) (NotAuthorized) if the caller is neither.
    pub fn submit_audit(
        &mut self,
        contract_target: String,
        risk_score: u8,
        summary: String,
        findings_critical: u8,
        findings_high: u8,
        findings_medium: u8,
        findings_low: u8,
        audited_at_ms: u64,
        audit_date: String,
    ) {
        let caller = self.env().caller();
        let agent = self.agent.get_or_revert_with(Error::AgentNotSet);
        let owner = self.owner.get_or_revert_with(Error::NotInitialized);

        // Only the authorized Agent or the Owner can submit audit records
        if caller != agent && caller != owner {
            self.env().revert(Error::NotAuthorized); // -> User(0)
        }

        let record = AuditRecord {
            contract_target: contract_target.clone(),
            risk_score,
            summary,
            findings_critical,
            findings_high,
            findings_medium,
            findings_low,
            audited_at_ms,
            audit_date,
            submitted_by: caller,
        };

        self.records.set(&contract_target, record);
        self.count.set(self.count.get_or_default() + 1);
    }

    /// Reads the audit record for a specific contract target address.
    pub fn get_audit(&self, contract_target: String) -> Option<AuditRecord> {
        self.records.get(&contract_target)
    }

    /// Returns the total number of audit records submitted to this registry.
    pub fn audit_count(&self) -> u32 {
        self.count.get_or_default()
    }
}
