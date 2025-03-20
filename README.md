# Luminor

A 3D browser-based game where players navigate a procedurally generated planet collecting energy.

## Project Improvements

We've made several key improvements to the codebase:

1. **ESLint Integration** - Added linting for code quality and consistency
2. **TypeScript Migration** - Converting JavaScript to TypeScript for type safety
3. **Code Organization** - Better structure and separation of concerns
4. **Build Optimization** - Improved build process and performance

## Current Status

- ✅ ESLint with flat config format
- ✅ TypeScript configuration and initial migration
- ✅ Fixed "callbacks is not defined" bug
- ✅ Improved code organization documentation
- ✅ Added build optimization recommendations

## Documentation

We've created several documentation files to guide development:

- [Improvements Documentation](./IMPROVEMENTS.md) - Summary of all improvements
- [TypeScript Progress](./TYPESCRIPT_PROGRESS.md) - Status of TypeScript migration
- [TypeScript Conversion Plan](./TYPESCRIPT_CONVERSION_PLAN.md) - Plan for converting remaining files
- [Code Organization](./CODE_ORGANIZATION.md) - Structure for better code organization
- [Build Optimization](./BUILD_OPTIMIZATION.md) - Performance optimization recommendations

## Development

### Prerequisites

- Node.js (v14+)
- npm

### Installation

```bash
# Install dependencies
npm install
```

### Running the Application

```bash
# Start development server
npm run start

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Tools

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# TypeScript type checking
npm run typecheck

# Convert JavaScript files to TypeScript
npm run convert-to-ts

# List JavaScript files to convert
npm run convert-to-ts:list
```

## License

[MIT](LICENSE) 