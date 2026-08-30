# SoundHub Frontend

This is the React/TypeScript frontend for SoundHub, built with Vite.

## Scripts

- `npm run dev` – start development server at http://localhost:5173
- `npm run build` – build for production
- `npm run preview` – preview production build
- `npm run test` – run Vitest tests
- `npm run test:watch` – watch mode for tests
- `npm run storybook` – start Storybook at http://localhost:6006
- `npm run build-storybook` – build Storybook static site
- `npm run lint` – run ESLint with accessibility rules

## Design System

- Design tokens are defined in `src/design-tokens.ts` (dark) and `src/theme/design-tokens.light.ts` (light).
- UI components live in `src/components/ui` and re-export tokens via `src/components/ui/index.ts`.
- Theme switching is available via `ThemeProvider` from `src/theme/themeContext.ts`.
- Storybook showcases components with controls and accessibility testing.
- To add a new token, edit the token files and update the TypeScript types.
- Ensure all new components use tokens directly or via the UI kit for consistency.

## Accessibility

- ESLint configured with `eslint-plugin-jsx-a11y`.
- Storybook includes the a11y addon for automated checks.
- Run `npm run lint` to catch accessibility issues early.
- Manual testing with axe core is recommended.

## UI Development

- Components are built with a DaVinci Resolve 21 inspired aesthetic: dark surfaces, orange accent, dense spacing.
- Use the `colors`, `spacing`, `radii`, `shadows`, `typography`, and `components` tokens from the design system.
- When creating new components, place them under `src/components/ui` and export them from the index file.
- Add corresponding stories in `*.stories.tsx` files.