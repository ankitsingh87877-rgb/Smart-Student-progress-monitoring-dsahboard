CC = gcc
CFLAGS = -Wall -Wextra -std=c99
TARGET = student_dashboard
OBJS = main.c graph_module.c dp_module.c

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) $(OBJS) -o $(TARGET) -lm

clean:
	rm -f $(TARGET) *.o

run: $(TARGET)
	./$(TARGET)
