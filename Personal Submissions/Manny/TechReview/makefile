# this is a comment

TARGET= main


default: pdf


dvi: ${TARGET}.tex
#	run latex twice to get references correct
	latex ${TARGET}.tex
#	you can also have a bibtex line here
	bibtex $(TARGET)
	latex $(TARGET).tex

ps: dvi
	dvips -R -Poutline -t letter ${TARGET}.dvi -o ${TARGET}.ps

pdf: ps
	ps2pdf ${TARGET}.ps

clean-dvi:
	rm -f main.aux
	rm -f main.log
	rm -f main.dvi
	rm -f main.out
	rm -f main.toc

clean-ps: clean-dvi
	rm -f main.ps

clean-pdf: clean-ps
	rm -f main.pdf

clean: clean-pdf
