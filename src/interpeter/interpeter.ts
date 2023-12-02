import { readFileSync } from "fs";
import { throwError } from "./error";
import { createInterface } from "readline";
import { createReadStream } from "fs";
import { STDNamespace, STDNumbersNamespace, StandardPackage, packageClasses, packageIncluded } from "./package";
import { setWorkingArguments, setWorkingFile, workingFile } from "./constants";
import { compile } from "../compiler/compiler";
import { intellisense } from "./intellesinse";

type InterpetedLine = {
    match: "constant" | "let" | undefined;
    type: "number" | "string" | "null" | "CLX_SPACE_TYPE" | "NAMESPACE_PACKAGE_IMPORT";
    name: string;
    value: string | number | object;
    line: number;
}

type InterpetedLineFunction = {
    type: "function";
    func_type: string;
    func_args: string[];
    name: string;
    code: string | undefined;
    whole_func: string;
    startLine: number;
    endLine: number
}

type Package = {
    name: string;
    type: string;
    custom_vars: any[];
    funcs: any[];
}

export function startInterpeter(file: string, args: string[]){
    if(!file) return throwError("NullFile", "Please include a file to compile.", 0, false);

    setWorkingFile(file);
    setWorkingArguments(args);

    console.log("Interpetering the code...");

    const lineReader = createInterface({
        input: createReadStream(file)
    });

    const interpetedLines: (InterpetedLine|InterpetedLineFunction)[] = [];
    const packages: Package[] = [];
    let curLine = 0;

    const standard = new StandardPackage();
    const fcs = Object.getOwnPropertyNames(Object.getPrototypeOf(standard)).filter((v)=>v!="constructor");

    packages.push({
        type: standard.type,
        name: standard.name,
        custom_vars: standard.custom_vars,
        funcs: fcs
    });

    let insideFunction = false;
    let currentFunction = "";
    let functionStartLine = 0;
    
    lineReader.on("line", (line: string) => {
        curLine++;

        if(curLine == 1){
            if(!line.startsWith("THIS IS esolangCXL__HEADER&&;")) {
                return throwError("Expected", "Expected a esolangCLX__HEADER import.", curLine);
            }
        }

        let lineExists;
        if(line.length > 0){
            lineExists = true;
        }else{
            lineExists = false;
        }

        if(line.replace(/\s/g, '').length > 0){
            lineExists = true;
        }else{
            lineExists = false;
        }

        if((lineExists) && !line.startsWith("vid_") && !line.endsWith("=> {") && (!line.endsWith(") {") && !line.endsWith("){")) && !line.startsWith("if(") && !line.startsWith("if (") && !line.startsWith("cap_") && !line.startsWith("i_")){
            if(!line.trim().endsWith(";")){
                return throwError("Expected", `Expected a ';' in line ${curLine}`, curLine)
            }
        }

        if(!lineExists) {
            interpetedLines.push({
                name: "SPACE",
                value: line,
                type: "CLX_SPACE_TYPE",
                match: undefined,
                line: curLine
            });
        }

        if(line.startsWith("USE") && line.includes("_NAMESPACE_")){
            const pack = line.split(" ")[line.split(" ").length-1].replace("//;", "");
            if(!line.split(" ")[line.split(" ").length-1].endsWith("//;")) return throwError("UnknownNamespace", "Unknown Namespace Import. (did you forget to add a // next to the semicolon in the end?)", curLine);
            interpetedLines.push({
                name: "IMPORT",
                value: pack,
                type: "NAMESPACE_PACKAGE_IMPORT",
                match: undefined,
                line: curLine
            })
        }

        if(line.startsWith("c ") || line.startsWith("l ")){
            const variableMatch = line.startsWith("c ") ? "constant" : "let";
            const variableName = line.replaceAll(" ", "").split("=")[0].replace(variableMatch == "constant" ? "c" : "l", "");
            const variableValue = line.split("=")[1].trimStart();
            let variableType = "unknown";
            if(variableValue.startsWith("&") && variableValue.endsWith("&;")){
                variableType = "string";
            }else if(variableValue.startsWith("N") && variableValue.endsWith("M;")){
                variableType = "number";
            }

            if(variableType == "string"){
                interpetedLines.push({
                    type: "string",
                    name: variableName,
                    value: variableValue,
                    match: variableMatch,
                    line: curLine
                });
            }else if(variableType == "number"){
                const nums = variableValue.split("N");
                nums.forEach((num, _i)=>{
                    if(!num.startsWith("N")){
                        nums[_i] = `N${nums[_i]}`
                    }
                    if(num.endsWith(";")){
                        nums[_i] = nums[_i].replaceAll(";", "");
                    }
                    nums[_i] = nums[_i].replaceAll(" ", "");
                    if(nums[_i].endsWith("+") || nums[_i].endsWith("-") || nums[_i].endsWith("*") || nums[_i].endsWith("/")){
                        let operation = "+";
                        if(nums[_i].endsWith("+")){
                            operation = "+";
                        }else if(nums[_i].endsWith("-")){
                            operation = "-";
                        }else if(nums[_i].endsWith("*")){
                            operation = "*";
                        }else if(nums[_i].endsWith("/")){
                            operation = "/";
                        }
                        nums[_i] = nums[_i].replace(operation, "") + ` ${operation}`;
                    }
                    if(nums[_i].endsWith("plus") || nums[_i].endsWith("minus") || nums[_i].endsWith("multiplicate") || nums[_i].endsWith("divide")){
                        let operation = "plus";
                        if(nums[_i].endsWith("plus")){
                            operation = "plus";
                        }else if(nums[_i].endsWith("minus")){
                            operation = "minus";
                        }else if(nums[_i].endsWith("multiplicate")){
                            operation = "multiplicate";
                        }else if(nums[_i].endsWith("divide")){
                            operation = "divide";
                        }
                        nums[_i] = nums[_i].replace(operation, "") + ` ${operation}`;
                    }
                    nums[_i] = nums[_i].replace("N", "")
                    nums[_i] = nums[_i].replace("M", "")
                });
                nums.splice(0, 1);

                interpetedLines.push({
                    type: "number",
                    name: variableName,
                    value: nums.join(" "),
                    match: variableMatch,
                    line: curLine
                });
            }
        }

        if(line.startsWith("vid_") || line.startsWith("i_") || line.startsWith("cap_")){
            insideFunction = true;
            functionStartLine = curLine;
            currentFunction += line + "\n";
        }

        if (insideFunction) {
            currentFunction += line + "\n";
    
            if (line.includes("};")) {
                insideFunction = false;

                const func = currentFunction.replace(currentFunction.split("\n")[0] + "\n", "");

                const caller = func.split("\n")[1];
                const regex: RegExp = /\b[A-Z_]+\b/g;
                const match: RegExpMatchArray | null = func.split(" ")[1].match(regex);

                const functionType = func.split(" ")[0];
                const functionName = match ? match[0].trim() : "unknwon lol";

                let functionArgs: string[] | string = func.split("(")[1].replace(":{", "").replace(": {", "").replace(")", "");
                functionArgs = functionArgs.slice(0, functionArgs.indexOf('\n')).split(",");

                if(functionArgs.length > 0 && functionArgs[0] == ""){
                    functionArgs.splice(0, 1);
                }

                const startIndex: number = func.indexOf("{");
                const endIndex: number = func.lastIndexOf("}");
                
                if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                    const functionCode: string = func.substring(startIndex + 1, endIndex).trim();
                    interpetedLines.push({
                        type: "function",
                        func_type: functionType,
                        func_args: functionArgs,
                        name: functionName,
                        code: functionCode,
                        whole_func: func,
                        startLine: functionStartLine,
                        endLine: curLine,
                    })
                }else{
                    interpetedLines.push({
                        type: "function",
                        func_type: functionType,
                        func_args: functionArgs,
                        name: functionName,
                        code: undefined,
                        whole_func: func,
                        startLine: functionStartLine,
                        endLine: curLine,
                    })
                }

                currentFunction = ""; 
            }
        }

        if(line == `USE GLOBAL THING AND _NAMESPACE_ std//;`){
            const pack = new STDNamespace();
            const funcs = Object.getOwnPropertyNames(Object.getPrototypeOf(pack)).filter((v) => v != "constructor");

            packages.push({
                type: pack.type,
                name: pack.name,
                custom_vars: pack.custom_vars,
                funcs
            });
        }

        if(line == `USE GLOBAL THING AND _NAMESPACE_ std_numbers//;`){
            const pack = new STDNumbersNamespace();
            const funcs = Object.getOwnPropertyNames(Object.getPrototypeOf(pack)).filter((v) => v != "constructor");

            packages.push({
                type: pack.type,
                name: pack.name,
                custom_vars: pack.custom_vars,
                funcs
            });
        }
    });

    lineReader.on("close", () => {
        const variables: Map<number, any> = new Map();
        let msgSent = false;
        let ccline = 1;
        let mainentry = false;

        interpetedLines.forEach((line) => {
            ccline++;
            if((<InterpetedLine>line).match){
                variables.set(ccline, line);
            }
            if(line.type == "number"){
                if(!packageIncluded("std_numbers", file)) return throwError("NamespaceError", "Did you forget to add a namespace called 'std_numbers' for numbers support?", ccline);
            }

            if((<InterpetedLineFunction>line).name == "CXL_MAIN"){
                mainentry = true;
            }
        });

        if(!mainentry){
            return throwError("NoMainEntry", "No main entry was found.", 0, false);
        }

        variables.forEach((var1, cclg)=>{
            variables.forEach((var2)=>{
                if(var1 != var2){
                    if(var1.name == var2.name && !msgSent){
                        msgSent = true;
                        return throwError("Duplicate", "Duplicate variables detected.", cclg);
                    }
                }
            })
        });

        intellisense();
        compile(interpetedLines, packages);
    })
}

export { InterpetedLine, InterpetedLineFunction, Package }