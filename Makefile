CC      ?= gcc
CFLAGS  ?= -O2 -Wall -Wextra
TARGET   = student_dashboard

all: $(TARGET)

$(TARGET): student_dashboard.c
	$(CC) $(CFLAGS) -o $@ $< -lm

run: $(TARGET)
	./$(TARGET)

clean:
	rm -f $(TARGET) $(TARGET).exe

.PHONY: all run clean
