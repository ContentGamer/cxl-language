import { readFileSync } from "fs";
import { Color } from "./color";
import { workingFile } from "./constants";

function readLineByNumberSync(filePath: string, lineNumber: number): string | null {
    const fileStream = readFileSync(filePath, 'utf-8').split('\n');
    if (lineNumber < 1 || lineNumber > fileStream.length) {
        return null;
    }
    return fileStream[lineNumber - 1];
}

function formatUptime(uptimeInSeconds: number): string {
    const timeUnits: [string, number][] = [
        ['day', 24 * 60 * 60],
        ['hour', 60 * 60],
        ['minute', 60],
        ['second', 1]
    ];

    for (const [unit, seconds] of timeUnits) {
        if (uptimeInSeconds >= seconds) {
            const count = Math.floor(uptimeInSeconds / seconds);
            return `${count} ${unit}${count !== 1 ? 's' : ''} ago`;
        }
    }

    return 'Just now';
}

export function throwError(errorType: string = "excepected", errorDetails: string = "Excpected a string, got a number.", line: number = 1, includeLine: boolean = true) {
    console.log(`${Color.FgRed}Error occured while trying to compile...\n`);

    const lineCode = readLineByNumberSync(workingFile, line);

    if(includeLine) console.log(`× ${Color.BgWhite}${Color.FgBlack} ${line} ${Color.Reset} ${lineCode}`);
    console.log(`${Color.FgRed}× ${errorType}:${Color.FgWhite} ${errorDetails}\n`);

    console.log(`${Color.BgGreen}${Color.BgBlack}Uptime: ${formatUptime(process.uptime())}${Color.Reset}`)

    console.log(`${Color.Reset}Exiting the program...`)
    console.log(`${Color.Reset}`);

    process.exit(0);
}