import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import json from "@rollup/plugin-json";

export default [
    {
        input: "./index.ts",
        output: [
            {
                file: "dist/esm/index.js",
                format: "esm",
                sourcemap: true,
            },
            {
                file: "dist/cjs/index.js",
                format: "cjs",
                sourcemap: true,
            },
        ],
        plugins: [
            peerDepsExternal(),
            resolve(),
            commonjs(),
            json(),
            typescript({ tsconfig: "./tsconfig.json" }),
        ],
        external: ["react", "react-dom", "styled-components"],
    },
];
