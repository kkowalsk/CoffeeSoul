FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY poc.py .
COPY seedData ./seedData

CMD ["python3", "poc.py"]
