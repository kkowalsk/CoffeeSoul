FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY service.py .
COPY seedData ./seedData

CMD ["python3", "service.py"]
