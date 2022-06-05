.PHONY: install test-keys build start test clean-test-keys stop

TEST_KEY := $(shell solana-keygen pubkey ./tests/test-key.json)

all: install test-keys build stop start test clean-test-keys stop

install:
	yarn install

test-keys:
	anchor build
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/nameXpT2PwZ2iA6DTNYTotTmiMYusBCYqwBLN2QgF4w/$$(solana-keygen pubkey ./target/deploy/namespaces-keypair.json)/g" {} +
	anchor build

build:
	anchor build
	yarn idl:generate

start:
	solana-test-validator --url https://api.devnet.solana.com \
		--clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s --clone PwDiXFxQsGra4sFFTT8r1QWRMd4vfumiWC1jfWNfdYT \
		--clone mgr99QFMYByTqGPWmNqunV7vBLmWWXdSrHUfV8Jf3JM --clone ojLGErfqghuAqpJXE1dguXF7kKfvketCEeah8ig6GU3 \
		--clone crt4Ymiqtk3M5w6JuKDT7GuZfUDiPLnhwRVqymSSBBn --clone 94mjR7rAf12K6u8WrLzUaZZnxtX1ZNBo3SPeQKZwXLx9 \
		--bpf-program ./target/deploy/namespaces-keypair.json ./target/deploy/namespaces.so \
		--reset --quiet & echo $$! > validator.PID
	sleep 10
	solana-keygen pubkey ./tests/test-key.json
	solana airdrop 1000 $(TEST_KEY) --url http://localhost:8899

test:
	anchor test --skip-local-validator --skip-build --skip-deploy --provider.cluster localnet

clean-test-keys:
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey ./target/deploy/namespaces-keypair.json)/nameXpT2PwZ2iA6DTNYTotTmiMYusBCYqwBLN2QgF4w/g" {} +

stop: validator.PID
	pkill solana-test-validator