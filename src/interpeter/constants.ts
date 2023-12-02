export let workingFile = "";
export function setWorkingFile(file: string){
    workingFile = file;
}

export let workingArguments: string[] = [];
export function setWorkingArguments(args: string[]){
    workingArguments = args;
}