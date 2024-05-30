import * as fs from "node:fs/promises";
import * as path from "node:path";

import { p } from "./parser.mjs";

function jsonEq(json1, json2) {
    if (typeof json1 != typeof json2) return false;
    if (json1 === null) {
        return json2 === null;
    }
    switch (typeof json1) {
    case "number":
    case "string":
    case "boolean":
        return json1 == json2;
    case "object":
        if (Array.isArray(json1)) {
            if (!Array.isArray(json2)) return false;
            if (json1.length != json2.length) return false;
            for (let i = 0; i < json1.length; i++) {
                if (!jsonEq(json1[i], json2[i])) return false;
            }
            return true;
        }
        if (Array.isArray(json2)) return false;
        const keys1 = new Set(Object.keys(json1));
        const keys2 = new Set(Object.keys(json2));
        for (let key of keys1.values()) {
            if (!keys2.has(key)) return false;
        }
        for (let key of keys2.values()) {
            if (!keys1.has(key)) return false;
        }
        for (let key of keys1.values()) {
            if (!jsonEq(json1[key], json2[key])) return false;
        }
        return true;
    }
    return false;
}

console.log("Reading files...");

const dir = (await fs.readdir("test_parsing")).filter(file => file[0] == "y");

const fileContents = await Promise.all(dir.map(file => fs.readFile(path.join("test_parsing", file))));

const fileInfo = fileContents.map((e, i) => [dir[i], e.toString()]);

console.log("Parsing...");

const parseResults = fileInfo.map(s => {
    let golfed;
    try {
        golfed = p(s[1]);
    } catch {
        golfed = undefined
    }
    return {
        reference: JSON.parse(s[1]),
        golfed,
        fileName: s[0],
        fileContents: s[1]
    }
});

console.log("Validating...");

let output = "";
for (let result of parseResults) {
    output += result.fileName.padEnd(60, " ");
    const success = jsonEq(result.reference, result.golfed);
    output += success ? "SUCCESS" : "FAIL";
    if (!success) {
        output += "    golfed: " + JSON.stringify(result.golfed) + "   VS    ";
        output += JSON.stringify(result.reference);
    }
    output += "\n";
}

await fs.writeFile("results.txt", output);