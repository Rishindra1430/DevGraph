 DevGraph

> A graph-powered developer ecosystem explorer built with React, Express, and CognoDB.

DevGraph is an interactive application for exploring relationships between developers, repositories, and technologies.

Instead of treating these entities as isolated records, DevGraph models them as a connected graph and allows users to explore collaboration networks, technology relationships, repositories, and paths between developers.

---

## Live Demo

### Application

https://dev-graph-woad.vercel.app/

### Backend API

https://devgraph-tjc0.onrender.com/

### GitHub Repository

https://github.com/Rishindra1430/DevGraph

> **Note:** The backend is hosted on Render's free tier and may take a short time to wake up after a period of inactivity.

---

# Overview

DevGraph is designed around a simple question:

> **How are developers, repositories, and technologies connected?**

The application uses GitHub-based developer and repository data and represents the ecosystem as a graph.

Users can:

- Explore developers
- View detailed developer profiles
- Explore repositories
- Explore technologies
- Search developers and repositories
- Find developers associated with multiple technologies
- Discover collaborators
- Visualize graph relationships
- Explore a developer's network
- Find connections between two developers
- Inspect technology relationships
- Navigate the ecosystem through graph-based relationships

The application is intended to make connected developer data understandable to a non-technical user through an interactive UI.

---

# Why a Graph Database?

The most important reason for using a graph database in DevGraph is that the interesting questions are about **relationships and paths**, rather than simply retrieving individual records.

A relational database could represent the same information using tables such as:

```text
Developers
Repositories
Technologies
Contributions
RepositoryTechnologies

However, many of the useful questions in DevGraph require repeatedly traversing those relationships.

For example:

Which developers have worked with a particular technology?
Which developers have experience with two technologies?
Who has collaborated with a particular developer?
Which repositories connect two developers?
How are two developers connected?
What is the shortest path between two developers?
Which technologies are related through shared repositories?

These questions naturally form graph traversals.

The core model is:

Developer
    |
    | CONTRIBUTED_TO
    v
Repository
    |
    | USES_TECH
    v
Technology

Developers can also become connected through shared repositories:

Developer A
     |
     | CONTRIBUTED_TO
     v
 Repository
     ^
     | CONTRIBUTED_TO
     |
Developer B

This makes collaboration a natural graph relationship.

For example, finding a connection between two developers may require a traversal such as:

Developer
    ↓
Repository
    ↓
Developer

or:

Developer
    ↓
Repository
    ↓
Developer
    ↓
Repository
    ↓
Developer

In a relational database, these kinds of variable-depth relationship queries would generally require multiple joins, recursive queries, or recursive CTEs.

With a graph database, the relationships are first-class entities and multi-hop traversal can be expressed naturally using Cypher.

This is where CognoDB provides a clear advantage for this application.

Graph Data Model

DevGraph uses three primary node types.

Nodes
Developer

Represents a GitHub developer.

Example properties include:

username
name
avatar
bio
followers
following
company
location
Repository

Represents a GitHub repository.

Example properties include:

id
name
fullName
description
stars
forks
url
Technology

Represents a technology associated with repositories.

Example properties include:

name
type
Relationships

The main graph relationships are:

(:Developer)-[:CONTRIBUTED_TO]->(:Repository)

(:Repository)-[:USES_TECH]->(:Technology)

This creates a connected ecosystem:

                    ┌──────────────┐
                    │  Technology  │
                    └──────▲───────┘
                           │
                       USES_TECH
                           │
                    ┌──────┴───────┐
                    │  Repository  │
                    └──────▲───────┘
                           │
                     CONTRIBUTED_TO
                           │
                    ┌──────┴───────┐
                    │   Developer  │
                    └──────────────┘

A repository can be connected to multiple technologies, and multiple developers can contribute to the same repository.

This allows the graph to naturally represent collaboration and technology ecosystems.

Graph Model Diagram

The following diagram represents the core graph structure:

This structure allows the application to answer relationship-oriented questions without flattening the graph into unrelated tables.

Multi-Hop Graph Traversal

One of the core requirements of the assignment is a query involving at least two hops.

DevGraph uses multi-hop traversals in its network and connection functionality.

For example:

Developer
    ↓
Repository
    ↓
Developer

represents a two-hop traversal.

A longer connection can look like:

Developer A
    ↓
Repository A
    ↓
Developer B
    ↓
Repository B
    ↓
Developer C

The Connection Explorer uses graph traversal to discover paths between developers.

The Network Explorer similarly traverses connected graph entities to build a visual representation of the developer ecosystem.

Queries That Are Awkward in a Relational Database

A good example is finding a path between two developers.

The question is:

"How are Developer A and Developer B connected?"

The answer may require traversing an unknown number of intermediate relationships.

For example:

Developer A
    ↓
Repository 1
    ↓
Developer C
    ↓
Repository 2
    ↓
Developer B

In a relational database, this becomes a recursive relationship problem and typically requires recursive CTEs or repeated joins.

In the graph model, the problem is naturally represented as a path traversal.

This is one of the primary reasons graph storage is appropriate for DevGraph.

Key Graph Queries

DevGraph separates graph query logic from its API route handlers.

The main query modules are located under:

server/src/queries/

The application contains query logic for:

Developers
Repositories
Technologies
Exploration
Network traversal
Developer connections
Developer Queries

Developer queries retrieve developer information and related graph entities.

Examples include:

Get developers
Get a developer by username
Get repositories contributed to by a developer
Get technologies associated with a developer
Get collaborators
Get evidence for technology relationships

These queries traverse relationships such as:

Developer → Repository
Developer → Repository → Technology
Developer → Repository ← Developer
Technology Queries

Technology queries allow the application to explore the technology side of the graph.

Examples include:

Get technologies
Get a technology
Get developers associated with a technology
Get repositories associated with a technology
Get related technologies

The resulting relationships can be represented as:

Technology
    ↑
    |
Repository
    ↑
    |
Developer
Technology Intersection

The Explore section supports technology intersection searches.

For example:

React + Neo4j

The graph can identify developers connected to both technologies through their repository contributions.

Conceptually:

Developer
   ├──→ Repository ──→ React
   │
   └──→ Repository ──→ Neo4j

This is a relationship-based query rather than a simple property lookup.

Collaboration Query

Developers who contribute to the same repository can be discovered through:

Developer
     ↓
Repository
     ↑
Developer

This relationship is used by the application to identify collaborators.

Network Query

The Network Explorer traverses relationships around a developer and returns connected nodes and relationships for visualization.

This allows the frontend to display a graph containing developers, repositories, and technologies.

Connection Query

The Connection Explorer searches for a path between two developers.

Conceptually:

Developer A
     ↓
Repository
     ↓
Developer B

or through multiple intermediate developers and repositories.

The resulting path is returned to the frontend and visualized as a graph.

Parameterised Cypher

The application uses the official Neo4j JavaScript driver to communicate with CognoDB.

User-provided values are passed as query parameters rather than being concatenated into Cypher strings.

For example, values such as:

username
technology name
search text
limits
depth

are passed separately to the query execution layer.

This keeps the query structure separate from user input and avoids constructing Cypher using string concatenation.

Data Seeding

DevGraph includes a data-loading pipeline under:

server/src/seed/

The seed system includes:

githubClient.js
githubImporter.js
seed.js
technologyMapping.js

The seeding process retrieves realistic GitHub developer and repository data and transforms it into the graph representation.

The GitHub API token is used to increase the available GitHub API rate limit during seeding.

Seed Commands

From the server directory:

npm run seed

To reset and reseed the database:

npm run seed:reset

The seed data is intentionally kept at a manageable scale so that it can run on the CognoDB free tier while still demonstrating meaningful graph relationships.

Architecture

DevGraph is divided into three primary layers:

┌─────────────────────────────┐
│       React Frontend        │
│                             │
│ React + Vite + React Router │
└──────────────┬──────────────┘
               │
               │ REST API
               ▼
┌─────────────────────────────┐
│       Express Backend       │
│                             │
│ Routes → Queries → Driver   │
└──────────────┬──────────────┘
               │
               │ Bolt / openCypher
               ▼
┌─────────────────────────────┐
│          CognoDB            │
│       Graph Database        │
└─────────────────────────────┘

The backend also communicates with the GitHub API during data collection/seeding.

Technology Stack
Frontend
React
Vite
React Router
Axios
D3
Tailwind CSS
Backend
Node.js
Express
Axios
CORS
dotenv
Neo4j JavaScript Driver
Database
CognoDB
openCypher
Bolt protocol
External Data Source
GitHub API
Deployment
Vercel — frontend
Render — backend
CognoDB Cloud — graph database
Application Features
1. Overview

The Overview page provides a high-level summary of the developer ecosystem.

It displays:

Developer statistics
Repository statistics
Technology statistics
Contribution statistics
Technology ecosystem
Featured network graph
Screenshot

Place your Overview screenshot here.

[SCREENSHOT: Overview dashboard]

Recommended screenshot:

Show the main dashboard with the statistics cards, Technology Ecosystem section, and Featured Network graph.

2. Explore

The Explore page allows users to discover developers and repositories based on technology relationships.

Users can explore:

Developers using a technology
Developers associated with multiple technologies
Repository relationships
Technology intersections
Screenshot

Place your Explore screenshot here.

[SCREENSHOT: Explore page]

Recommended screenshot:

Show an Explore query such as React + Neo4j and the resulting developers/repositories.

3. Developer Profiles

Each developer has a dedicated profile page.

The profile provides information such as:

Developer details
GitHub profile
Repositories
Technologies
Collaborators
Contribution activity
Technology experience
Screenshot

Place your Developer Profile screenshot here.

[SCREENSHOT: Developer Profile]

Recommended screenshot:

Show a developer profile with repositories, technology experience, collaborators, and contribution activity.

4. Technology Explorer

The Technology section allows users to explore technologies in the graph.

Users can view:

Technology information
Developers using the technology
Repositories using the technology
Related technologies
Screenshot

Place your Technology Explorer screenshot here.

[SCREENSHOT: Technology Explorer]

Recommended screenshot:

Show a technology detail page with related developers, repositories, and related technologies.

5. Network Explorer

The Network Explorer provides an interactive visualization of graph relationships.

It can display connections between:

Developers
Repositories
Technologies

Users can interact with the graph and inspect connected entities.

Screenshot

Place your Network Explorer screenshot here.

[SCREENSHOT: Network Explorer]

Recommended screenshot:

Show the graph with multiple connected developers, repositories, and technologies.

6. Connection Explorer

The Connection Explorer focuses specifically on finding paths between developers.

Users can select two developers and explore the graph relationship between them.

Example:

Developer A
     ↓
Repository
     ↓
Developer B

For more complex relationships:

Developer A
     ↓
Repository 1
     ↓
Developer C
     ↓
Repository 2
     ↓
Developer B
Screenshot

Place your Connection Explorer screenshot here.

[SCREENSHOT: Connection Explorer]

Recommended screenshot:

Show two selected developers and the resulting path through the graph.

7. Global Search

DevGraph provides a global search interface for discovering developers and repositories.

The search interface is available from the main application header.

It supports:

Developer search
Repository search
Keyboard navigation
Ctrl + K / Cmd + K shortcut
Search result selection
Direct navigation to results

Repository search is backed by the repository API rather than treating repository names as technology names.

Screenshot

Place your Global Search screenshot here.

[SCREENSHOT: Global Search]

Recommended screenshot:

Show the search dropdown containing developer and repository results.

Routing

The frontend uses React Router for client-side navigation.

Main routes include:

/
 /explore
 /developers
 /developers/:username
 /technologies
 /technologies/:name
 /network
 /connections

A catch-all route provides a custom 404 page.

The application also supports browser:

Back
Forward
Refresh

without losing the application shell.

Project Structure
DevGraph/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js
│   │   │
│   │   ├── assets/
│   │   │
│   │   ├── components/
│   │   │   └── NetworkGraph.jsx
│   │   │
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx
│   │   │
│   │   └── views/
│   │       ├── Overview.jsx
│   │       ├── Explore.jsx
│   │       ├── Developers.jsx
│   │       ├── DeveloperProfile.jsx
│   │       ├── Technologies.jsx
│   │       ├── TechnologyDetail.jsx
│   │       ├── NetworkExplorer.jsx
│   │       ├── ConnectionExplorer.jsx
│   │       ├── Docs.jsx
│   │       ├── Support.jsx
│   │       └── NotFound.jsx
│   │
│   ├── vercel.json
│   ├── vite.config.js
│   ├── package.json
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── queries/
│   │   │   ├── developers.js
│   │   │   ├── explore.js
│   │   │   ├── network.js
│   │   │   ├── repositories.js
│   │   │   └── technologies.js
│   │   │
│   │   ├── routes/
│   │   │
│   │   ├── seed/
│   │   │   ├── githubClient.js
│   │   │   ├── githubImporter.js
│   │   │   ├── seed.js
│   │   │   └── technologyMapping.js
│   │   │
│   │   └── server.js
│   │
│   ├── package.json
│   └── ...
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
Environment Variables

Database credentials and API tokens are stored in environment variables and are not committed to the repository.

Backend

Create a .env file inside server/.

Example:

NEO4J_URI=bolt+s://your-instance.databases.cognodb.cloud
NEO4J_USERNAME=cognodb
NEO4J_PASSWORD=your-secure-password
NEO4J_DATABASE=neo4j

PORT=5000

CORS_ORIGIN=http://localhost:5173

GITHUB_TOKEN=your-github-personal-access-token
Frontend

The frontend uses:

VITE_API_URL=http://localhost:5000/api

For production:

VITE_API_URL=https://devgraph-tjc0.onrender.com/api

Never commit actual Neo4j credentials, database passwords, or GitHub tokens.

Local Setup
Prerequisites

You will need:

Node.js
npm
A CognoDB Cloud account
A CognoDB instance
Git
A GitHub token for seeding
1. Clone the repository
git clone https://github.com/Rishindra1430/DevGraph.git
cd DevGraph
2. Create a CognoDB instance

Go to:

https://console.cognodb.com/signup

Create a free c0 instance.

CognoDB provides connection details in the form:

bolt+s://<instance-id>.databases.cognodb.cloud

Save the generated password securely.

The application connects using:

Username: cognodb

and the generated database password.

3. Configure the backend
cd server
npm install

Create:

server/.env

Add:

NEO4J_URI=bolt+s://<instance-id>.databases.cognodb.cloud
NEO4J_USERNAME=cognodb
NEO4J_PASSWORD=<your-password>
NEO4J_DATABASE=neo4j

PORT=5000

CORS_ORIGIN=http://localhost:5173

GITHUB_TOKEN=<your-github-token>
4. Seed the database

Run:

npm run seed

Or reset and reseed:

npm run seed:reset

The seed process retrieves realistic GitHub data and creates the corresponding graph nodes and relationships.

5. Start the backend
npm start

The backend will run on:

http://localhost:5000

Health check:

http://localhost:5000/api/health
6. Start the frontend

Open another terminal:

cd client
npm install
npm run dev

The frontend will normally run at:

http://localhost:5173
API Overview

The backend exposes REST endpoints for interacting with the graph.

Health
GET /api/health

Used to verify API and database availability.

Developers
GET /api/developers
GET /api/developers/:username
GET /api/developers/:username/repositories
GET /api/developers/:username/technologies
GET /api/developers/:username/collaborators
GET /api/developers/:username/evidence
Repositories
GET /api/repositories

Supports repository search and repository-related filtering.

Technologies
GET /api/technologies
GET /api/technologies/:name
GET /api/technologies/:name/developers
GET /api/technologies/:name/repositories
GET /api/technologies/:name/related
Explore
GET /api/explore
GET /api/explore/repositories
Network
GET /api/network
GET /api/network/developer/:username
GET /api/network/collaborators/:username
Connections
GET /api/connections

The connection endpoint accepts two developers and returns the graph path between them.

Error Handling

DevGraph is designed to fail gracefully when the backend or database is unavailable.

The frontend displays a dedicated API connection error state rather than crashing the application.

The backend centralizes API/database error handling and returns appropriate error responses to the frontend.

The health endpoint provides a simple way to verify whether the backend and database are reachable.

Deployment
Frontend — Vercel

The React frontend is deployed on Vercel.

https://dev-graph-woad.vercel.app/

The Vercel project uses:

Root Directory: client
Build Command: npm run build
Output Directory: dist

The production API endpoint is configured using:

VITE_API_URL
Backend — Render

The Express backend is deployed on Render.

https://devgraph-tjc0.onrender.com/

The backend environment contains the CognoDB credentials, GitHub token, and production CORS configuration.

The frontend production origin is allowed through:

CORS_ORIGIN
Security

Sensitive configuration is intentionally excluded from source control.

The repository does not contain:

CognoDB passwords
GitHub personal access tokens
Production database credentials
Production secrets

Only .env.example files containing placeholder values are committed.
