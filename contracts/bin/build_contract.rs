#![no_std]
#![no_main]
#![allow(unused_imports, clippy::single_component_path_imports)]

#[cfg(target_arch = "wasm32")]
extern crate alloc;

#[path = "../src/audit_registry.rs"]
pub mod audit_registry;
