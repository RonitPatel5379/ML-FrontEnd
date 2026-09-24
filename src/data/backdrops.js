import space from "../assets/backdrop-space.jpg";
import neon from "../assets/backdrop-neon.jpg";
import desert from "../assets/backdrop-desert.jpg";
import gothic from "../assets/backdrop-gothic.jpg";

export const BACKDROPS = { space, neon, desert, gothic };

export const backdropFor = (movie) => BACKDROPS[movie?.backdrop] || space;
