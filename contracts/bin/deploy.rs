use odra::prelude::*;
use std::env;
use casperguard_contracts::audit_registry::AuditRegistry;
use odra::host::{Deployer, InstallConfig, NoArgs};
use odra_casper_livenet_env;

pub fn main() {
    env::set_var("ODRA_CASPER_LIVENET_ENV", "casper_livenet.env");
    let env = odra_casper_livenet_env::env();
    env.set_gas(300_000_000_000u64); // 300 CSPR

    println!("Deploying AuditRegistry...");
    let registry = AuditRegistry::deploy_with_cfg(&env, NoArgs, InstallConfig::upgradable::<AuditRegistry>());
    let reg_address = format!("{:?}", registry.address());
    println!("AuditRegistry deployed at: {}", reg_address);

    println!("✅ Deployment Successful!");
}
