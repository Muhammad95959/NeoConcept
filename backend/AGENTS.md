# AGENTS.md - NeoConcept Backend Guidelines

## Project Overview
Node.js/Express backend with TypeScript, Prisma ORM, Jest testing, and PostgreSQL.

## Commands

### Development
```bash
pnpm dev                    # Start development server with tsx watch
```

### Testing
```bash
pnpm test                           # Run all tests
pnpm test -- src/path/test.test.ts  # Run single test file
pnpm test -- src/utils/            # Run all tests in directory
pnpm test:watch                    # Watch mode
pnpm test:coverage                 # Coverage report
pnpm test:ci                       # CI mode (sequential + coverage)
pnpm test:debug                    # Debug mode with inspector
```

### Database
```bash
pnpm prisma generate               # Generate Prisma client
pnpm prisma migrate                # Run migrations
pnpm prisma studio                 # Open Prisma Studio
```

## Code Style Guidelines

### TypeScript Configuration
- Strict mode enabled (`"strict": true`)
- ESNext target, CommonJS modules
- Use `zod` for runtime validation
- Use `ZodSchema` type for validation schemas

### Imports

**Order (recommended):**
1. Node built-ins (fs, path, etc.)
2. External packages (express, prisma, etc.)
3. Internal modules (../../utils, ../../types, etc.)

**Examples:**
```typescript
import fs from "fs";
import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { Role, Status } from "../../generated/prisma";
import CustomError from "../../types/customError";
import { HTTPStatusText } from "../../types/HTTPStatusText";
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `UserService`, `CustomError` |
| Types/Interfaces | PascalCase | `UserInput`, `UpdateUserInputService` |
| Enums | PascalCase | `Role`, `Status` (from Prisma) |
| Static classes | PascalCase | `ErrorMessages`, `SuccessMessages` |
| Functions | camelCase | `signToken`, `verifyToken` |
| Variables | camelCase | `userId`, `courseId` |
| Constants | UPPER_SNAKE | `JWT_SECRET`, `MAX_FILE_SIZE` |
| Files | kebab-case | `user.service.ts`, `error-handler.ts` |
| Directories | kebab-case | `utils/`, `middlewares/` |

### Error Handling

**Use CustomError class:**
```typescript
throw new CustomError(message, statusCode, statusText);
```

**Error Messages - Use ErrorMessages class:**
```typescript
import { ErrorMessages } from "../../types/errorsMessages";
throw new CustomError(ErrorMessages.USER_NOT_FOUND, 404, HTTPStatusText.FAIL);
```

**Status Codes:**
- 400: Bad Request (validation, business logic)
- 401: Unauthorized (authentication)
- 403: Forbidden (authorization)
- 404: Not Found
- 409: Conflict (duplicate)
- 500: Internal Server Error

### Response Format

**Success Response:**
```typescript
res.status(200).json({
  status: HTTPStatusText.SUCCESS,
  data: result,
});
```

**Error Response:**
```typescript
res.status(400).json({
  status: HTTPStatusText.FAIL,
  message: "Error description",
});
```

### Directory Structure

```
src/
├── config/          # Configuration (db.ts, passport.ts)
├── generated/       # Prisma generated types
├── middlewares/     # Express middlewares
│   ├── protect.ts
│   ├── validate.ts
│   ├── restrict.ts
│   └── tests/
├── modules/         # Feature modules
│   ├── auth/
│   ├── users/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.model.ts
│   │   ├── user.route.ts
│   │   ├── user.validation.ts
│   │   ├── user.type.ts
│   │   └── tests/
│   ├── courses/
│   ├── posts/
│   ├── resources/
│   ├── meetings/
│   ├── tracks/
│   ├── studentRequests/
│   └── staffRequests/
├── types/           # Shared types
│   ├── errorsMessages.ts
│   ├── successMessages.ts
│   ├── customError.ts
│   └── HTTPStatusText.ts
└── utils/           # Utility functions
    ├── signToken.ts
    ├── verifyToken.ts
    └── tests/
```

### Service Pattern

Services are static classes with async methods:
```typescript
export class UserService {
  static async updateUser({ userId, username, password }: UpdateUserInputService) {
    // Implementation
  }
}
```

### Model Pattern

Models interact with Prisma and return data:
```typescript
export class UserModel {
  static async updateById(userId: string, data: any) {
    return prisma.user.update({ where: { id: userId }, data });
  }
}
```

### Validation with Zod

Define schemas in `*.validation.ts` files:
```typescript
export class UserValidationSchemas {
  static updateUser = z.object({
    username: z.string().trim().min(1).optional(),
    password: z.string().min(6).optional(),
  }).refine((data) => data.username || data.password, {
    message: "Username or password is required",
  });
}
```

Export inferred types:
```typescript
export type UpdateUserInput = z.infer<typeof UserValidationSchemas.updateUser>;
```

### Middleware Pattern

```typescript
export const validate = (schema: { body?: ZodSchema; params?: ZodSchema; query?: ZodSchema }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) res.locals.body = schema.body.parse(req.body);
      if (schema.params) res.locals.params = schema.params.parse(req.params);
      if (schema.query) res.locals.query = schema.query.parse(req.query);
      next();
    } catch (err: any) {
      return res.status(400).json({
        status: HTTPStatusText.FAIL,
        message: err.errors?.[0]?.message || "Validation error",
      });
    }
  };
};
```

### Testing Patterns

- Tests in `*.test.ts` files alongside source files
- Mock dependencies with `jest.mock()`:
```typescript
jest.mock("./user.model", () => ({
  UserModel: {
    updateById: jest.fn(),
    findCourseWithInstructors: jest.fn(),
  },
}));
```
- Use `jest.clearAllMocks()` in `beforeEach`
- Test error cases first, then success cases
- Use `toMatchObject` for partial matching
