import { Buffer } from "buffer";
import process from "process";

// Set up Node.js polyfills for browser
window.Buffer = Buffer;
window.process = process;
(window.process as any).browser = true;
