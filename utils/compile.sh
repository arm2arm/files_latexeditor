#!/bin/bash
pdflatex logo.tex
inkscape \
	  --without-gui \
	    --file=logo.pdf \
		  --export-plain-svg=logo.svg
