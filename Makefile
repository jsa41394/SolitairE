all:
	git add .
	git commit -m "$(shell date --iso=seconds)"
	git push