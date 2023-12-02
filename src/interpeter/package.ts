import { createReadStream, readFileSync } from "fs";
import { createInterface } from "readline";

// CXL Package Browser coming soon.

export class StandardPackage {
    type: string = "namespace";
    name: string = "standard";
    custom_vars: any[] = [];

    constructor(){}
    clx_SHUTUP(exitCode: number){
        process.exit(exitCode);
    }
    clx_wait_keypress(key: string): Promise<any> {
        return new Promise(resolve => {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
    
            const onData = (chunk: any) => {
                const keyPress = chunk.trim();
                if (keyPress === key) {
                    resolve({  });
                    process.stdin.removeListener('data', onData);
                    process.stdin.setRawMode(false);
                }
            };
    
            process.stdin.on('data', onData);
        });
    }
}

export class STDNamespace {
    type: string = "namespace";
    name: string = "std";
    custom_vars: any[] = [];

    constructor(){}
    cxl_printf(...args: string[]) {
        console.log(...args);
    }
}

export class STDNumbersNamespace {
    type: string = "namespace";
    name: string = "std_numbers";
    custom_vars: any[] = [
        { name: "numberPackage", value: true }
    ];

    constructor(){}
}

export function packageIncluded(packageName: string, file: string, packageType: string = "_NAMESPACE_") {
    const lines = readFileSync(file, { encoding: "utf8" }).split("\n");
    for (let i_ = 0; i_ < lines.length; i_++) {
        const line = lines[i_];
        if(line.startsWith(`USE GLOBAL THING AND ${packageType} ${packageName}//;`))
        {
            return true;
        }
    }

    return false;
}

export const packagesMap: { [key: string]: any } = {
    'std': STDNamespace,
    'std_numbers': STDNumbersNamespace,
    'standard': StandardPackage
};

export function getPKGCode(packageName: string, methodName: string) {
    const selectedPackage = packagesMap[packageName];
    if (selectedPackage) {
        const selectedClass = new selectedPackage();
        const method = selectedClass[methodName];
        if (typeof method === 'function') {
            let tsCode = method.toString();

            tsCode = tsCode.replace(/\(([^)]*)\)/, (match: any, args: any) => {
                const modifiedArgs = args.replace(/(\w+)\s*:\s*\w+/g, 'any');
                return `(${modifiedArgs})`;
            });

            return tsCode;
        }
    }
    return null;
}

export const packageClasses = [STDNamespace, STDNumbersNamespace];