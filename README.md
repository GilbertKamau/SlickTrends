# Slick Trends

Slick Trends is a full-stack web application designed for analyzing and keeping up with the latest trends. 

This repository contains both the frontend and backend applications for the platform.

## Architecture

*   **Frontend**: Built with Next.js (React), Tailwind CSS, Framer Motion, and Zustand for state management. It also integrates Stripe and PayPal for payments.
*   **Backend**: A Node.js application built with Express and TypeScript. It uses PostgreSQL and Redis, and integrates with services like Stripe, PayPal, Cloudinary, and Nodemailer.
*   **Infrastructure as Code**: Includes a `terraform` directory for infrastructure provisioning.
*   **Automation**: Includes an `automation` directory, likely for CI/CD or chore tasks.

## Prerequisites

Before running the application, make sure you have the following installed:

*   Node.js (v18 or higher recommended)
*   npm (Node Package Manager)
*   PostgreSQL
*   Redis

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/GilbertKamau/SlickTrends.git
cd SlickTrends
```

### 2. Run the Backend

Navigate to the `backend` directory, install dependencies, and start the development server.

```bash
cd backend
npm install
npm run dev
```

*Note: Ensure your `.env` file is properly configured based on `.env.example` in the backend directory.*

### 3. Run the Frontend

Open a new terminal window, navigate to the `frontend` directory, install dependencies, and start the Next.js development server.

```bash
cd frontend
npm install
npm run dev
```

*Note: Ensure your `.env.local` file is properly configured in the frontend directory.*

The frontend will typically be available at `http://localhost:3000` and the backend will run on its configured port (usually `5000` or `8000`).

## Deployment

The application provides infrastructure definitions in the `terraform` directory. Use these definitions to provision the necessary cloud resources before deploying the application.
