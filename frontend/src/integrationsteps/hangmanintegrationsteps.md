## Hangman Integration Steps

1. **Copy Hangman source into the host project**  
   - Added `frontend/src/games/hangman/` and moved the Hangman app’s `App.js`, `Hangman.js`, CSS, test files, and supporting assets (`index.js`, `index.css`, `reportWebVitals.js`, etc.) into that folder with their original structure.

2. **Create a wrapper component**  
   - Added `frontend/src/games/hangman/index.tsx` that imports the Hangman `App`, wraps it in `StrictMode`, and pulls in the feature’s `index.css`, giving the main project a clean React component to render.

3. **Normalize JSX filenames and retire the CRA entry point**  
   - Renamed JSX-bearing files (`App.js`, `Hangman.js`) to `.jsx` so Vite parses them correctly.  
   - Renamed the original CRA `index.js` to `index-original.js` to keep it out of the build; the new `index.tsx` is the entry point used by the host app.

4. **Expose the Hangman route**  
   - Imported `HangmanGame` in `frontend/src/App.tsx` and registered `<Route path="/hangman" element={<HangmanGame />} />` alongside the existing `/` and `/sudoku` routes.

5. **Wire navigation to the new route**  
   - Updated `frontend/src/home.tsx` so the navigation array points “Hangman” at `/hangman` and replaced the relevant `<a>` tags with React Router `<Link>` components in both the desktop and mobile menus (also converting the logo link to use `<Link>`).

6. **Validate locally**  
   - Ran `npm run dev`, confirmed the homepage still loads, and verified that selecting “Hangman” in both navigation menus transitions to the integrated Hangman game without console errors.

The Hangman feature now lives under `/hangman` and is seamlessly routed and styled within the main Vite/React application, mirroring the Sudoku integration pattern.
