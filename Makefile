.PHONY: setup test lint clean
setup:
	npm install

test:
	npm test

lint:
	npm run lint

clean:
	-rm -rf node_modules
