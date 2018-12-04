pdf: 
	latex main.tex
	bibtex main
	latex main
	latex main
	dvips -P pdf main.dvi
	ps2pdf main.ps

clean: 
	rm -f *.aux *.log *.dvi *.ps main.pdf *.bbl *.blg *.toc
