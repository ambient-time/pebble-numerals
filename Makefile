.PHONY: test art build
art:
	node tools/generate-art.cjs
	python3 tools/pack-art.py
test:
	mkdir -p build
	clang -std=c11 -Wall -Wextra -Werror -fsanitize=address,undefined test/model.c src/c/model.c -o build/model-test
	python3 tools/test-resources.py
	node --test test/settings.cjs
build:
	pebble build --sdk 4.33.1
