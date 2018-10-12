FILENAME=main
$(FILENAME).pdf: $(FILENAME).ps
	ps2pdf $(FILENAME).ps
	rm main.dvi main.aux main.ps main.log
 
$(FILENAME).ps: $(FILENAME).dvi
	dvips $(FILENAME).dvi

$(FILENAME).dvi: $(FILENAME).tex
	latex --verbose $(FILENAME).tex
