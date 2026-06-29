import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import { bunny } from "laravel-vite-plugin/fonts";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        react(),
        laravel({
            input: ["resources/css/app.css", "resources/js/app.jsx"],
            refresh: true,
            fonts: [
                bunny("Instrument Sans", {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        tailwindcss(),
    ],

    resolve: {
        alias: {
            "./images/layers.png":
                "./node_modules/leaflet/dist/images/layers.png",
            "./images/layers-2x.png":
                "./node_modules/leaflet/dist/images/layers-2x.png",
            "./images/marker-icon.png":
                "./node_modules/leaflet/dist/images/marker-icon.png",
        },

        server: {
            watch: {
                ignored: ["**/storage/framework/views/**"],
            },
        },
    },
});
