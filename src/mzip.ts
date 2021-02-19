import fs from 'fs';

/*
 * Read in the file, split on word boundaries.
 * create a dictionary. Order by popularity.
 */
interface Compressed{
    dictionary:[string,number][], 
    text:number[];
}
interface CompressedB64
{
    dictionary:[string,number][], 
    text:string;
}

function breakText(text: string): string[] {

    let res:RegExpMatchArray|null =  text.match(/\w+|\s+|[^\s\w]+/g);
    let results:string[] = new Array<string>();
    if (res){
        res.forEach((item:string):void=>{
            results.push(item);
    })}
    
    return results;
}

function createDictionary(tokens:string[]):Map<string,number>{
    let wordCounts:Map<string,number> = new Map();
    tokens.forEach((item:string)=>{
        let counter:number = wordCounts.get(item)? wordCounts.get(item)!+1:1;
        wordCounts.set(item,counter);
    });
    return wordCounts;
}

function sortMap(wordMap:Map<string,number>):Map<string,number>{
    
    return new Map([...wordMap.entries()].sort((a:[string,number], b:[string,number]) => b[1]-a[1]));

}

/*
 * create a map to use for the dictionary lookup, the most used entries will
 * have the smallest number
 */

function createLookup(inputMap:Map<string,number>):Map<string,number>{
    // read through the frequency map, and create a new map mapping 
    // word to position in the frequency map.
    // this will ensure that the most common words have the smallest numbers
    let i=1;
    let outputMap = new Map<string,number>();
    inputMap.forEach((count:number,word:string)=>{
        outputMap.set(word,i++);
    });
    return outputMap;
}
function encode(dictionary:Map<string,number>,wordArray:string[]):Compressed{
    let output:number[] = new Array<number>();
    wordArray.forEach((word:string)=>{
        if (dictionary.has(word)){
            let index:number=dictionary.get(word)!;
            output.push(index);
        }
        
    });
    let returnObject = { dictionary: Array.from(dictionary.entries()), text: output};
    return returnObject;
}
function binaryEncode(dictionary:Map<string,number>,wordArray:string[]):CompressedB64{
    let typeArray = new Int16Array(wordArray.length);
    let i=0;
    wordArray.forEach((word:string)=>{
        if (dictionary.has(word)){
            let index:number=dictionary.get(word)!;
            typeArray[i++]=index;
        }
        
    });
    let output="";
    let returnObject = { dictionary: Array.from(dictionary.entries()), text: output};
    return returnObject;
}
function decode(input:Compressed):string{
    // get the dictionary and swap it so we can lookup by value;
    let dictionary:Map<string,number> = new Map(input.dictionary);
    let reverseDictionary:Map<number,string> = new Map<number,string>();
    dictionary.forEach((value:number,key:string)=>{
        reverseDictionary.set(value,key);
    });

    // read through the array and translate the numbers back to words
    let answer:string = "";
    let numbers:number[] = input.text;

    numbers.forEach((value)=>{
        let word:string = reverseDictionary.get(value)!;
        answer = answer + word;
    });

    return answer;
}
function readFile(filename:string):string{
    return fs.readFileSync(filename,'utf8');
}
function writeFile(filename:string,contents:string):void{
    fs.writeFileSync(filename,contents);
}

function main(){
    
    let bootText:string = readFile("dracula.txt");
    let wordArray:string[] = breakText(bootText);
    let wordMap:Map<string,number> = createDictionary(wordArray);
    let sortedWordMap:Map<string,number> = sortMap(wordMap);
    writeFile("wordcounts.txt",JSON.stringify(Array.from(sortedWordMap.entries())));

    let lookupMap:Map<string,number> = createLookup(sortedWordMap);
    let compressed:Compressed = encode(lookupMap,wordArray); 
    let cs:string = JSON.stringify(compressed);
    
    writeFile("intermediate.json",cs);
    let cs2:Compressed = <Compressed>JSON.parse(readFile("intermediate.json"));
    
    let decodedText = decode(cs2);
    writeFile("output.txt",decodedText);
    
    //console.log(decodedText);
}

main();