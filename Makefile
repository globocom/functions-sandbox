.PHONY: setup test test_unit lint clean
setup:
	npm install

test: test_unit lint

test_unit:
	npm test

lint:
	npm run lint

clean:
	-rm -rf node_modules
