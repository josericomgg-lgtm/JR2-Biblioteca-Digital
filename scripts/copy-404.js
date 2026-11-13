
import { copyFileSync } from "node:fs";

copyFileSync("dist/index.html", "dist/404.html");

console.log("Archivo 404.html creado correctamente.");
