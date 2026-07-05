#![no_std]
#![no_main]

#[cfg(not(target_arch = "wasm32"))]
compile_error!("target arch should be wasm32: compile with '--target wasm32-unknown-unknown'");

extern crate alloc;

use alloc::string::String;
use alloc::vec;
use casper_contract::contract_api::{runtime, storage};
use casper_types::{
    contracts::NamedKeys, EntryPoint, EntryPointAccess, EntryPointType, EntryPoints, Parameter, CLType,
};



#[no_mangle]
pub extern "C" fn submit_audit() {
    let contract_target: String = runtime::get_named_arg("contract_target");
    let risk_score: u8 = runtime::get_named_arg("risk_score");
    let summary: String = runtime::get_named_arg("summary");
    let findings_critical: u8 = runtime::get_named_arg("findings_critical");
    let findings_high: u8 = runtime::get_named_arg("findings_high");
    let findings_medium: u8 = runtime::get_named_arg("findings_medium");
    let findings_low: u8 = runtime::get_named_arg("findings_low");
    let audited_at_ms: u64 = runtime::get_named_arg("audited_at_ms");
    let audit_date: String = runtime::get_named_arg("audit_date");
    
    // Simplistic storage just to prove on-chain execution
    runtime::put_key(&contract_target, storage::new_uref(audit_date).into());
}

#[no_mangle]
pub extern "C" fn call() {
    let mut entry_points = EntryPoints::new();
    entry_points.add_entry_point(EntryPoint::new(
        "submit_audit",
        vec![
            Parameter::new("contract_target", CLType::String),
            Parameter::new("risk_score", CLType::U8),
            Parameter::new("summary", CLType::String),
            Parameter::new("findings_critical", CLType::U8),
            Parameter::new("findings_high", CLType::U8),
            Parameter::new("findings_medium", CLType::U8),
            Parameter::new("findings_low", CLType::U8),
            Parameter::new("audited_at_ms", CLType::U64),
            Parameter::new("audit_date", CLType::String),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    let (contract_package_hash, _) = storage::create_contract_package_at_hash();
    let (contract_hash, _) = storage::add_contract_version(
        contract_package_hash,
        entry_points,
        NamedKeys::new(),
    );

    runtime::put_key("casperguard_audit_registry_package_hash", contract_package_hash.into());
    runtime::put_key("casperguard_audit_registry_contract_hash", contract_hash.into());
}
