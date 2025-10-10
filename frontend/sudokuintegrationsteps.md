## Sudoku Integration Steps

1. **Create project space for the game**  
   - Added `frontend/src/games/sudoku/` and copied the Sudoku repo’s `components`, `services`, `utils`, `App.css`, `App.js`, `index.js`, and related assets into that folder while keeping their original structure.

2. **Enable JavaScript files inside the Vite + TypeScript app**  
   - Updated `frontend/tsconfig.app.json` by adding `"allowJs": true` and `"checkJs": false` under `compilerOptions` so `.js` files from the Sudoku feature compile without conversion.

3. **Wrap the Sudoku app for use inside the host app**  
   - Added `frontend/src/games/sudoku/index.tsx` exporting a `SudokuGame` component that renders the original Sudoku `<App />` inside `StrictMode` and imports the game’s CSS.

4. **Install and configure React Router**  
   - Ran `npm install react-router-dom` from `frontend/`.  
   - Wrapped `<App />` with `<BrowserRouter>` in `frontend/src/main.tsx`.

5. **Configure application routes**  
   - Replaced the root component in `frontend/src/App.tsx` with a `<Routes>` tree that maps `/` to `<Home />` and `/sudoku` to the new `<SudokuGame />`.

6. **Hook navigation into the router**  
   - Imported `{ Link }` from `react-router-dom` in `frontend/src/home.tsx`.  
   - Updated the navigation items to use `<Link to="/">` and `<Link to="/sudoku">` so clicking “Sudoku” swaps the route (also applied to the mobile menu and logo).

7. **Normalize Sudoku source files for Vite**  
   - Renamed JSX-bearing files (`App.js`, `components/SudokuGame.js`, `components/SudokuBoard.js`, `components/SudokuCell.js`) to `.jsx` so Vite parses them correctly.  
   - Renamed the original `index.js` to `index-original.js` to keep it out of the build and relied on the new `index.tsx` entry point instead.

8. **Test locally**  
   - Ran `npm run dev`, confirmed the homepage renders, and validated navigation to `/sudoku` loads the integrated Sudoku UI without console errors.

With these steps complete, the Sudoku game now lives under `/sudoku` inside the main Vite/React application and shares the host project’s routing and layout framework.
