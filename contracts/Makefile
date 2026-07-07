build:
	cargo build --release --target wasm32-unknown-unknown
	wasm-strip target/wasm32-unknown-unknown/release/audit_registry.wasm 2>/dev/null || true
	mkdir -p wasm
	cp target/wasm32-unknown-unknown/release/audit_registry.wasm wasm/
