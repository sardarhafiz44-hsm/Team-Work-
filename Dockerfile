# ================================================
# SolShield Pro — Docker Deployment
# ================================================
# Build: docker build -t solshield-pro .
# Run:   docker run -p 8000:8000 solshield-pro
# ================================================

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for Slither + Foundry
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Foundry
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/root/.foundry/bin:${PATH}"
RUN foundryup

# Install Python dependencies
COPY backened/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Slither
RUN pip install slither-analyzer

# Install solc-select for dynamic compiler switching
RUN pip install solc-select

# Copy backend code
COPY backened/ .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
