import { existsSync, mkdir, mkdirSync, rmSync, rmdir, writeFile, writeFileSync } from "fs";
import { InterpetedLine, InterpetedLineFunction, Package } from "../interpeter/interpeter";
import { throwError } from "../interpeter/error";
import { minify, writeDestFile } from "minify-ts";
import { getPKGCode } from "../interpeter/package";
import { obfuscate } from "javascript-obfuscator";
import { workingArguments } from "../interpeter/constants";
import { Color } from "../interpeter/color";
import { fork, exec } from "child_process";
import { VM } from "vm2";

function runJavaScriptFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(`node ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            if (stderr) {
                reject(stderr);
                return;
            }
            resolve(stdout);
        });
    });
}

export function compile(lines: (InterpetedLine|InterpetedLineFunction)[], packages: Package[]) {
    console.log("Compiling the code...");

    if (!existsSync("out")){
        try {
            mkdirSync("out", { recursive: true });
        }catch { return throwError("DirectoryError", "Could not make a output directory.", 0, false); }
    }

    let compiledLines = "/// Compiled by ContentXLang Compiler\n";
    let STANDARD_PACKAGE_RAN = false;

    lines.forEach((line)=>{
        if(line.type == "NAMESPACE_PACKAGE_IMPORT"){
            packages.forEach((pkg)=>{
                if(pkg.name == "standard" && !STANDARD_PACKAGE_RAN){
                    let packAGES = "";
                    STANDARD_PACKAGE_RAN = true;
                    pkg.funcs.forEach((func)=>{
                        packAGES += `function ${getPKGCode(`${pkg.name}`, `${func}`)}\n`;
                    });
                    compiledLines += packAGES + "\n";
                }
                if(pkg.name == line.value)
                {
                    let packAGES = "";
                    pkg.funcs.forEach((func)=>{
                        packAGES += `function ${getPKGCode(`${pkg.name}`, `${func}`)}\n`;
                    });
                    compiledLines += packAGES + "\n";
                }
            });
        }
        if(line.type == "CLX_SPACE_TYPE"){
            compiledLines += "\n";
        }
        if(line.type == "string"){
            compiledLines += `${line.match == "constant" ? "const" : "let"} ${line.name} = ${(line.value as string).replaceAll("&", '"')}\n`
        }
        if(line.type == "number"){
            compiledLines += `${line.match == "constant" ? "const" : "let"} ${line.name} = ${(line.value as string).replaceAll('"', "")}\n`
        }
        if(line.type == "function"){
            const func_args = line.func_args;
            func_args.forEach((arg, _i)=>{
                const type = arg.split(" ")[0];
                const name = arg.split(" ")[1];

                if(type == "i"){
                    func_args[_i] = `${name}`;
                }
                if(type == "cap_"){
                    func_args[_i] = `${name}`;
                }
                if(type == "shut"){
                    func_args[_i] = `${name}`;
                }

                if(type == "list_shut[]"){
                    func_args[_i] = `${name}`;
                }
                
                if(type == "list_shut[]?"){
                    func_args[_i] = `${name}`;
                }
            })
            compiledLines += `const ${line.name} = (${func_args.join(", ")}) => {\n   ${line.code}\n}\n`
        }

        compiledLines = compiledLines.replaceAll(/\bplus\b/g, '+');
        compiledLines = compiledLines.replaceAll(/\bminus\b/g, '-');
        compiledLines = compiledLines.replaceAll(/\bmultiplicate\b/g, '*');
        compiledLines = compiledLines.replaceAll(/\bdivide\b/g, '/');

        const _cli = compiledLines.split("\n");
        for (let i = 0; i < _cli.length; i++) {
            const line = _cli[i];
            if(line.trim().startsWith("c ") && line.endsWith(";") && line.includes("="))
            {
                _cli[i] = _cli[i].replace("c ", "const ");
            }
            if(line.trim().startsWith("l ") && line.endsWith(";") && line.includes("="))
            {
                _cli[i] = _cli[i].replace("l ", "let ");
            }
        }
        compiledLines = _cli.join("\n");
        compiledLines = compiledLines.replaceAll("SELF_GET::", "");
        compiledLines = compiledLines.replaceAll("cap_reverse(", "!(");
        compiledLines = compiledLines.replaceAll(/&/g, '"');
    });

    compiledLines += `\nCXL_MAIN(${workingArguments.length > 0 ? workingArguments.join(", ") : ""})`;
    compiledLines = obfuscate(compiledLines).getObfuscatedCode();

    writeFileSync("out/compiled.js", compiledLines);
    console.log(`\n${Color.FgYellow}Compiling Done${Color.FgWhite} Compiling is done. running the code... (the output below will the result of the code)${Color.Reset}\n`);

    runJavaScriptFile("out/compiled.js").then((a=>{
        console.log(a);
        rmSync("out", { recursive: true, force: true });
    })).catch((err=>{
        rmSync("out", { recursive: true, force: true });
    }));
}