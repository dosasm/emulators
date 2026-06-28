import del from "del";
import { execute } from "./execute";

import { series } from "gulp";

function clean() {
    return del(["dist/types"], { force: true });
}

async function types() {
    console.log("skipped types generation")
    await execute("yarn","tsc", "-p",".");
}

export const emitTypes = series(clean, types);
