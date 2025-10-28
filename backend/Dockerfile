FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.3

WORKDIR /workspace

RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}"

COPY pyproject.toml /workspace/
RUN poetry lock --no-update

COPY app /workspace/app
COPY tests /workspace/tests
COPY README.md /workspace/
COPY pytest.ini /workspace/
COPY .env.example /workspace/.env.example

RUN poetry install --no-interaction --no-ansi

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
