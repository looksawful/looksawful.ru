import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(Flip, ScrollTrigger);

window.gsap = gsap;
window.Flip = Flip;
window.ScrollTrigger = ScrollTrigger;

export { gsap, Flip, ScrollTrigger };