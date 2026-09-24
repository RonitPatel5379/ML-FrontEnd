# CineVerse Hub - ML-FrontEnd

Create a fully fledged, production-quality Movie Recommendation System using React.js with JavaScript only.

1. Technology Requirements

Use:

React.js

JavaScript only — NO TypeScript

Vite

React Router DOM

CSS3 / modern CSS

Axios or Fetch API

Context API for global state management

Lucide React or another modern icon library

Framer Motion for animations

LocalStorage for user preferences, watchlist, favorites, and recently watched movies

Do NOT use TypeScript.

Do NOT create .tsx or .ts files.

Keep the code modular, clean, reusable, and beginner-friendly.

2. Overall UI/UX

The application should look like a premium modern movie streaming/recommendation platform inspired by the visual quality of Netflix, Disney+, HBO Max, Apple TV+, and modern movie discovery platforms, but with its own unique design.

The UI should feel:

Premium

Cinematic

Modern

Minimal

Smooth

Responsive

Professional

Interactive

Use a dark cinematic theme as the default.

Suggested visual style:

Background: almost-black / deep navy

Cards: dark glassmorphism surfaces

Accent: purple / violet / electric blue

Text: white and muted gray

Large cinematic movie posters

Large hero banners

Soft gradients

Subtle shadows

Rounded corners

Glassmorphism

Smooth hover effects

Micro-interactions

Smooth page transitions

Avoid making the UI look like a simple CRUD application.

3. Application Name

Use the name:

CineVerse

Create a beautiful logo/text treatment for:

CineVerse

Tagline:

"Discover your next favorite movie."

4. Main Pages

Create the following pages:

Home

Route:

/

The homepage should contain:

Sticky transparent navbar

CineVerse logo

Navigation:

Home

Discover

Genres

Trending

Watchlist

Favorites

Search icon / search bar

Notification icon

User profile menu

Large cinematic Hero Section

Hero should contain:

Large movie backdrop

Movie poster

Movie title

Rating

Release year

Runtime

Genre

Short description

"Watch Trailer" button

"Add to Watchlist" button

"More Details" button

Use a dark gradient over the background image so text remains readable.

Hero should automatically rotate between featured movies.

Add smooth transition animations.

5. Trending Movies Section

Create a horizontal movie carousel.

Title:

Trending Now

Each movie card should display:

Poster

Movie title

Rating

Release year

Genre

On hover:

Card slightly scales

Show gradient overlay

Show Play button

Show Add to Watchlist button

Show movie rating

Show short description

Use smooth animations.

6. Personalized Recommendation Section

Create:

Recommended For You

The recommendation section should be visually prominent.

Example:

"Because you watched Interstellar"

Display recommended movies based on:

Genres

Ratings

Previously watched movies

Favorites

Watchlist

Search history

For the initial frontend version, create a simple recommendation algorithm using JavaScript.

For example:

If the user likes:

Sci-Fi

Adventure

Drama

then recommend movies with similar genres.

Create reusable recommendation logic.

Keep the recommendation algorithm separated from UI components.

7. Movie Categories

Create sections such as:

Popular Movies

Top Rated

New Releases

Trending This Week

Action & Adventure

Science Fiction

Comedy

Drama

Horror

Romance

Animation

Each section should contain horizontally scrollable movie cards.

8. Discover Page

Route:

/discover

Create a powerful movie discovery interface.

Include:

Search

Search movies by:

Movie name

Actor

Director

Genre

Filters

Add filters for:

Genre

Release Year

Rating

Language

Runtime

Popularity

Add sorting:

Popular

Highest Rated

Newest

Oldest

A-Z

Display results in a responsive grid.

Desktop:

4–6 cards per row

Tablet:

3–4 cards

Mobile:

2 cards

9. Search Experience

Create a modern search interface.

When the user clicks search:

Open an animated search overlay or expanded search bar.

Display:

Search movies, actors, genres...

Show live search results.

Include:

Movie poster

Movie title

Year

Rating

Genre

If no results:

Show a beautiful empty state:

"We couldn't find that movie."

and suggest similar searches.

10. Movie Details Page

Route:

/movie/:id

Create a highly detailed movie page.

Include:

Hero

Large backdrop

Poster

Movie title

Rating

Release date

Runtime

Genres

Certification

Overview

Buttons:

Watch Trailer

Add to Watchlist

Favorite

Share

Movie Information

Display:

Director

Writers

Cast

Languages

Production companies

Budget

Revenue

Cast Section

Create horizontal actor cards.

Similar Movies

Show recommended similar movies.

Reviews

Create movie review UI.

Display:

User avatar

Username

Rating

Review

Date

Allow users to submit a review in the frontend.

11. Watchlist Page

Route:

/watchlist

Users should be able to save movies.

Display:

My Watchlist

Include:

Movie poster

Title

Rating

Year

Genre

Remove button

Mark as watched button

Store watchlist in LocalStorage.

If empty:

Show an attractive empty-state illustration/message:

"Your watchlist is waiting."

12. Favorites Page

Route:

/favorites

Users can mark movies as favorites.

Display favorite movies in a grid.

Persist favorites using LocalStorage.

13. Recently Watched

Create a section:

Continue Watching

Store recently opened movies in LocalStorage.

Display them horizontally.

Show a progress bar under each movie poster.

Example:

72% watched

14. Genres Page

Route:

/genres

Create a visually impressive genre selection page.

Create large cards for:

Action

Adventure

Animation

Comedy

Crime

Documentary

Drama

Fantasy

Horror

Mystery

Romance

Sci-Fi

Thriller

Each genre card should have:

Background movie image

Gradient overlay

Genre name

Number of movies

Hover should create a cinematic zoom effect.

Clicking a genre should navigate to filtered movie results.

15. Trending Page

Route:

/trending

Create a dedicated trending page.

Include:

Trending Today

Trending This Week

Trending This Month

Create ranking numbers:

01
02
03

Use a visually impressive ranking layout.

16. User Profile

Create:

/profile

Display:

Avatar

Username

Email

Favorite genres

Movies watched

Movies in watchlist

Favorite movies

Average movie rating

Create a "Favorite Genres" visualization.

Example:

Sci-Fi — 45%

Drama — 25%

Action — 20%

Comedy — 10%

Allow users to update their profile preferences.

17. Recommendation Preferences

Create a preference/onboarding page.

Route:

/preferences

Ask:

"What kind of movies do you love?"

Allow users to select multiple genres.

Example:

☐ Action
☐ Adventure
☐ Comedy
☐ Crime
☐ Drama
☐ Fantasy
☐ Horror
☐ Romance
☐ Sci-Fi
☐ Thriller

Also allow selecting:

Favorite languages

Minimum rating

Preferred release period

Save preferences to LocalStorage.

Use these preferences in the recommendation system.

18. Recommendation Algorithm

Create a JavaScript recommendation engine.

Create a separate file:

src/utils/recommendationEngine.js

The recommendation engine should consider:

User favorite genres

Watchlist genres

Recently watched movies

Movie ratings

Movie popularity

User-selected preferences

Calculate a recommendation score.

Example:

Genre Match       = 40%
Rating            = 25%
Popularity        = 15%
Recent Activity   = 10%
Preference Match  = 10%


Sort movies according to recommendation score.

Display:

"Recommended For You"

and explain why:

"Because you like Sci-Fi"

"Similar to Interstellar"

"Highly rated by users like you"

19. Components

Create reusable components.

Suggested structure:

src/
│
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── Hero.jsx
│   ├── MovieCard.jsx
│   ├── MovieRow.jsx
│   ├── MovieGrid.jsx
│   ├── SearchBar.jsx
│   ├── SearchOverlay.jsx
│   ├── FilterBar.jsx
│   ├── GenreCard.jsx
│   ├── Rating.jsx
│   ├── CastCard.jsx
│   ├── ReviewCard.jsx
│   ├── LoadingSpinner.jsx
│   ├── EmptyState.jsx
│   └── ProtectedRoute.jsx
│
├── pages/
│   ├── Home.jsx
│   ├── Discover.jsx
│   ├── MovieDetails.jsx
│   ├── Genres.jsx
│   ├── Trending.jsx
│   ├── Watchlist.jsx
│   ├── Favorites.jsx
│   ├── Profile.jsx
│   ├── Preferences.jsx
│   ├── Login.jsx
│   └── NotFound.jsx
│
├── context/
│   ├── AuthContext.jsx
│   ├── MovieContext.jsx
│   └── UserContext.jsx
│
├── services/
│   └── movieApi.js
│
├── utils/
│   ├── recommendationEngine.js
│   ├── localStorage.js
│   └── helpers.js
│
├── data/
│   └── movies.js
│
├── App.jsx
├── main.jsx
└── index.css


20. API Integration

Design the application so it can work with a movie API such as TMDB.

Create a centralized API service:

src/services/movieApi.js

Implement functions such as:

getTrendingMovies()
getPopularMovies()
getTopRatedMovies()
getMovieDetails(id)
getSimilarMovies(id)
searchMovies(query)
getMoviesByGenre(genreId)


Do not put API calls directly inside every component.

Use reusable service functions.

Use environment variables for API keys.

Example:

VITE_TMDB_API_KEY


Never hard-code API keys inside components.

21. Loading States

Every API-dependent section must have a proper loading state.

Create modern skeleton loaders.

For example:

Movie card skeleton

Hero skeleton

Movie details skeleton

Profile skeleton

Do not simply display:

"Loading..."

Make the loading UI visually polished.

22. Error Handling

Create beautiful error states.

Examples:

Something went wrong

Unable to load movies.

Buttons:

Try Again

Also handle:

Network errors

Empty API response

Invalid movie ID

Missing movie poster

Missing backdrop

23. Responsive Design

The entire application must be responsive.

Support:

Desktop

Laptop

Tablet

Mobile

Pay special attention to:

Navbar

Hero section

Movie cards

Carousels

Filters

Search

Movie details

Profile

On mobile, convert the navbar into a hamburger menu.

Movie cards should resize properly.

Do not allow horizontal page overflow.

24. Animations

Use Framer Motion.

Add subtle animations:

Page transitions

Card hover

Button hover

Modal opening

Search overlay

Navbar

Hero transitions

Genre cards

Movie details

Toast notifications

Animations should feel premium and not excessive.

25. Toast Notifications

Create reusable toast notifications.

Examples:

Added to Watchlist ✓

Removed from Watchlist

Added to Favorites ❤️

Movie removed from Favorites

26. Authentication UI

Create frontend authentication pages:

/login

/register

Login page should contain:

Email

Password

Remember me

Login button

Forgot password

Google login UI

Register link

Register page:

Name

Email

Password

Confirm password

Register button

For this version, authentication can be simulated using LocalStorage.

Structure the code so a real backend can easily replace the simulated authentication later.

27. Navigation

Use React Router.

Routes:

/
 /discover
 /trending
 /genres
 /genres/:genre
 /movie/:id
 /watchlist
 /favorites
 /profile
 /preferences
 /login
 /register


Add a 404 page.

28. Navbar Behavior

Navbar should initially be transparent over the hero.

When scrolling:

Add dark background

Add blur effect

Add shadow

Reduce height slightly

Make navbar sticky.

Desktop navigation and mobile navigation should both be polished.

29. Movie Card Design

Create a premium reusable MovieCard.

Example layout:

┌─────────────────────────┐
│                         │
│      MOVIE POSTER       │
│                         │
│          ▶             │
│                         │
├─────────────────────────┤
│ Interstellar             │
│ ★ 8.7   2014   Sci-Fi   │
└─────────────────────────┘


Hover:

Scale 1.04

Dark overlay

Show play icon

Show favorite icon

Show watchlist icon

Show quick information

30. Accessibility

Follow basic accessibility standards.

Use:

Semantic HTML

Alt text

Keyboard navigation

Focus states

Accessible buttons

ARIA labels where appropriate

Good color contrast

31. Performance

Optimize the application.

Use:

Lazy loading images

React lazy loading for pages

Efficient rendering

Reusable components

Avoid unnecessary API calls

Debounce search input

LocalStorage caching where useful

32. Data

Initially provide a realistic local movie dataset in:

src/data/movies.js

Include at least 30–50 movies.

Each movie should have:

{
    id: 1,
    title: "Interstellar",
    poster: "...",
    backdrop: "...",
    rating: 8.7,
    year: 2014,
    runtime: 169,
    genres: ["Sci-Fi", "Drama"],
    overview: "...",
    director: "...",
    cast: [],
    language: "English"
}


Use realistic data.

Design the application so this local dataset can later be replaced by TMDB API data without rewriting the UI.

33. Footer

Create a premium footer.

Include:

CineVerse logo

About CineVerse

Browse Movies

Genres

Watchlist

Contact

Privacy Policy

Terms

Social media icons

Add:

© 2026 CineVerse. All rights reserved.

34. Overall User Experience

The user journey should feel like:

Open CineVerse
      ↓
See cinematic hero
      ↓
Explore trending movies
      ↓
Search / Discover
      ↓
Open movie details
      ↓
Add to Watchlist / Favorite
      ↓
Watch / Explore
      ↓
System learns preferences
      ↓
Personalized recommendations


35. Important UI Requirements

The final UI must NOT look like:

Basic Bootstrap website

Simple CRUD dashboard

Plain HTML page

Generic movie-card grid

Beginner project

Template with no animations

It should look like a real commercial movie discovery product.

Use:

Cinematic gradients

Glass effects

Modern typography

Large imagery

Smooth animations

Premium spacing

Strong visual hierarchy

Responsive layouts

Modern icons

Interactive states

36. Code Quality

Follow these rules:

JavaScript only

Functional React components

React Hooks

Reusable components

No duplicated code

Meaningful variable names

Clean folder structure

Comments only where useful

Keep business logic outside UI components

Separate API logic from UI

Separate recommendation logic from UI

Use Context API where global state is required

37. Final Deliverable

Generate the complete project.

Provide:

Vite setup

Folder structure

All React components

All pages

CSS

Context providers

LocalStorage utilities

Recommendation algorithm

Movie data

API service

Routing

Authentication UI

Responsive design

Animations

Loading states

Error states

Empty states

Toast notifications

The project must run with:

npm install
npm run dev


Make sure there are no missing imports, broken routes, undefined variables, or placeholder components.

Build the application as if it were a real-world modern movie recommendation platform, not a simple college demo.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/97b2d08a-fae5-4716-b177-830e67babb5c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
