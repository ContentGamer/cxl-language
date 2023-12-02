/*!
  MIT License

  Copyright (c) 2023 ContentGamer

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

/**
   * @author ContentGamer

   * Hey! thanks for checking in the ContentXLang programming language
   This uses a typescript-nodejs (ts-node) interpeter, made with my own bare hands without any of 
   the fancy npm helper packages. just bare code.

   * You can fork this repository and fix some bugs and ask for a pull request, or make the code better and maybe
   improve the compiler, since i think all codes are a bit.. uhm, overflowed with the .replace function.., BUT you cannot change the .README File if you want to fork
   this repository.
*/

import { startInterpeter } from "./interpeter/interpeter";

const file = process.argv[2];
const args = process.argv.splice(3, process.argv.length);

console.log("Welcome to the CLX Compiler\n");
startInterpeter(file, args);