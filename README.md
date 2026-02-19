<img width="500" src="https://github.com/user-attachments/assets/1d9af671-7838-45ee-a810-54a30e605c30" />

# Werkyn

Open-source project management and collaboration for teams. **Coming Soon.**

## Our [Live Demo](https://demo.werkyn.com/) is ready!

Open-source project management for teams who self-host. Kanban boards, team workspaces, calendar views, and a command palette, all self-hosted with Docker Compose. No SaaS fees, no vendor lock-in, just your data on your infrastructure.

## Notice

⚠️ **This project is a development preview.** It is functional but still under active development. Expect breaking changes before a stable release.

## Features

### Project Management
- **Kanban Boards** - Visual task management with customizable status columns

<img width="1000" alt="werkyn-kanban" src="https://github.com/user-attachments/assets/fdb2332a-ec57-414e-af82-dfc80ba76645" />

- **List View** - Table view with sorting, filtering, and bulk operations

<img width="1000" alt="werkyn-list_dark" src="https://github.com/user-attachments/assets/42b05fd6-aaff-4400-9acb-41bf535963bb" />

- **Calendar View** - Timeline and calendar integration for scheduling
- **Task Properties** - Rich task details including:
  - Priorities (Urgent, High, Medium, Low)
  - Assignees and labels
  - Due dates and start dates
  - Subtasks and dependencies
  - Comments with @mentions
  - File attachments
  - Custom fields (text, number, date, select)
- **Task Templates** - Reusable task templates for common workflows
- **Recurring Tasks** - Automatically create tasks on schedules
- **Real-time Updates** - WebSocket-powered live collaboration

### Wiki & Documentation
- **Notion-like Editor** - Rich text editing with BlockNote
- **Spaces & Pages** - Organized wiki structure
- **Team Documentation** - Collaborative knowledge base

<img width="1000" alt="werkyn_wiki" src="https://github.com/user-attachments/assets/c949ec7b-758b-4c3d-844b-ae693eb0370e" />

### File Management
- **Personal Files** - Private file storage per user
- **Team Shares** - Shared folders and team collaboration
- **File Uploads** - Direct file attachments to tasks

<img width="1000" alt="werkyn-drive" src="https://github.com/user-attachments/assets/16185112-393a-48d7-97b4-cf5af73360bd" />

### Workspace Features
- **Multi-workspace Support** - Organize projects by workspace
- **Team Collaboration** - Member management and permissions
- **Command Palette** - Quick navigation and actions (cmdk)
- **Dark Mode** - Modern UI with theme support

## Tech Stack

### Frontend
- **React 19** - Latest React with modern features
- **Vite** - Fast build tool and dev server
- **TanStack Router** - Type-safe file-based routing
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **Tailwind CSS v4** - Utility-first styling
- **Mantine UI** - Component library
- **BlockNote** - Rich text editor
- **FullCalendar** - Calendar component
- **dnd-kit** - Drag and drop functionality

### Backend
- **Node.js** - Runtime environment
- **Fastify 5** - Fast web framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Database
- **WebSocket** - Real-time communication
- **JWT** - Authentication
- **Zod** - Schema validation

### Infrastructure
- **pnpm Workspaces** - Monorepo package management
- **TypeScript** - Type safety across the stack
- **Docker Compose** - Single-command containerized deployment

## Project Structure

This is a pnpm monorepo with three packages:

```
werkyn/
├── packages/
│   ├── shared/      # Zod schemas, TypeScript types, and constants
│   ├── backend/     # Fastify HTTP/WebSocket server with Prisma
│   └── frontend/    # React SPA with Vite
├── package.json     # Root workspace configuration
└── tsconfig.base.json
```

### Architecture
- **Backend modules** follow routes → controller → service layering
- **Authorization** resolves workspace context from route params
- **Real-time events** broadcast via WebSocket subscriptions
- **Frontend features** organized into feature folders with `api.ts`, `components/`, and `hooks/`

## Getting Started

### Prerequisites
- **Docker** and **Docker Compose**

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/werkyn.git
cd werkyn
```

2. Start the application:
```bash
docker compose up --build
```

This builds the app image, starts PostgreSQL, runs database migrations, and launches the server.

- **App**: `http://localhost:3000`
- **Mailpit** (email testing UI): `http://localhost:8025`

## Local Development

For contributors who want to run outside of Docker:

### Prerequisites
- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Docker** (for PostgreSQL and Mailpit)

### Setup

1. Start the infrastructure services:
```bash
docker compose up postgres mailpit
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cd packages/backend
cp .env.example .env
# Edit .env with your database connection and other settings
```

4. Set up the database:
```bash
cd packages/backend
pnpm db:generate
pnpm db:migrate
pnpm db:seed  # Optional: seed with sample data
```

5. Start development servers:
```bash
# From the root directory
pnpm dev
```

This will start both the backend and frontend in development mode:
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

### Available Scripts

**Root level:**
- `pnpm dev` - Start both backend and frontend in development mode
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

**Backend (`packages/backend`):**
- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:migrate` - Run database migrations
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:studio` - Open Prisma Studio

**Frontend (`packages/frontend`):**
- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

## Contributing

Contributions are welcome! This project is in active development. Please check back soon for contribution guidelines and code of conduct.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file for details.

The AGPL-3.0 license ensures that:
- You can use, modify, and distribute the software
- If you modify the software and run it as a network service, you must make the source code available to users
- All modifications must be released under the same license

## Links

- **Live Demo**: [demo.werkyn.com](https://demo.werkyn.com/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/werkyn/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/werkyn/discussions)

