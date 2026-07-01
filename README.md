# Pipeline Builder

A visual, drag-and-drop CI/CD pipeline builder. Design a pipeline once using a
unified visual model, and generate ready-to-use configs for **GitHub Actions**,
**GitLab CI**, and **Jenkins** — plus a dry-run simulator and a rough cloud
cost estimator, before you ever commit a line of YAML.

## Features

- **Visual drag-and-drop editor** — build pipelines from Stages → Jobs → Steps
  by dragging step blocks (Checkout, Run Command, Cache, Upload/Download
  Artifact, Docker Build, Deploy) onto the canvas.
- **Multi-platform output** — one pipeline definition generates:
  - `.github/workflows/pipeline.yml` (GitHub Actions)
  - `.gitlab-ci.yml` (GitLab CI)
  - `Jenkinsfile` (Jenkins declarative pipeline)
- **Template library** — start from prebuilt templates (Node CI, Docker
  build+deploy, Python lint/test/deploy) or contribute your own pipeline back
  to the shared library.
- **Dry-run simulation** — simulates execution stage-by-stage/job-by-job,
  producing a timestamped log, timing estimates, and validation warnings
  (e.g. a "Run" step with no command) — without touching any real
  infrastructure.
- **Cost estimation** — estimates per-run and monthly cost across GitHub
  Actions, GitLab CI, and a self-hosted Jenkins runner, broken down by job.

## Project structure

```
pipeline-builder/
├── backend/                  Express API
│   ├── server.js             App entrypoint
│   ├── routes/                generate.js, simulate.js, cost.js, templates.js
│   ├── lib/
│   │   ├── generators/       githubActions.js, gitlabci.js, jenkins.js
│   │   ├── simulator.js      Dry-run engine
│   │   └── costEstimator.js  Cost calculation
│   └── data/templates.json   Seeded + community-contributed templates
└── frontend/                 React (Vite) single-page app
    └── src/
        ├── App.jsx           Pipeline state + layout
        └── components/       Sidebar, Canvas, ConfigPanel, OutputPanel,
                               DryRunPanel, CostPanel, TemplateLibrary
```

## Requirements

- Node.js 18+ and npm

## How to run

Open two terminals — one for the backend API, one for the frontend dev server.

### 1. Start the backend

```bash
cd backend
npm install
npm start
```

The API starts on **http://localhost:4000**. Verify it's running:

```bash
curl http://localhost:4000/api/health
```

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app opens on **http://localhost:5173**. The dev server proxies `/api/*`
requests to the backend on port 4000 (see `frontend/vite.config.js`), so no
extra configuration is needed.

### 3. Use the app

1. Drag step blocks from the left sidebar onto a job in the canvas to build
   your pipeline, or open the **Templates** tab on the right and click **Use**
   on a starter template.
2. Click a step to edit its configuration (command, image tag, cache path...)
   in the right panel.
3. Use **+ Add Stage** / **+ Add Job** to expand the pipeline. Jobs within the
   same stage are treated as parallel; stages run sequentially and each job
   automatically depends on all jobs in the previous stage.
4. Click **▶ Dry Run** to simulate execution and see a timestamped log plus
   any configuration warnings.
5. Click **💲 Estimate Cost** to see a projected per-run and monthly cost
   across all three platforms (assumes 30 runs/month by default).
6. Click **⚙ Generate YAML** to produce the GitHub Actions, GitLab CI, and
   Jenkinsfile output. Use **Copy** or **Download** in the Output tab to grab
   the file for the platform you need.
7. Happy with your pipeline? Open **Templates → + Share current pipeline** to
   contribute it back to the library for others to reuse.

## Building for production

```bash
cd frontend
npm run build
```

This outputs a static build to `frontend/dist/`, which can be served by any
static file host (nginx, Vercel, S3 + CloudFront, etc.) as long as `/api/*`
requests are routed to a running instance of the backend.

For the backend, run it behind a process manager (pm2, systemd, Docker) and
set the `PORT` environment variable if you need something other than 4000.

## Notes on the generated configs

- **GitHub Actions**: stages become `needs:` dependency chains between jobs;
  triggers map to `on.push` / `on.pull_request` / `on.schedule` /
  `on.workflow_dispatch`.
- **GitLab CI**: stages map directly to GitLab's `stages:` list; job
  dependencies use `needs:`; cache/artifact steps populate the job's
  `cache:`/`artifacts:` blocks.
- **Jenkins**: produces a declarative `Jenkinsfile`. Push/PR triggers are
  normally configured via a webhook + multibranch pipeline job in the Jenkins
  UI rather than in the Jenkinsfile itself, so only `schedule` triggers are
  reflected in the generated file (as a `cron` trigger).

Cost figures are **illustrative approximations** based on public pricing as a
guide for relative comparison — always confirm actual costs with your
provider's pricing calculator before budgeting.
