export let p = str => {
    // a minifier will shorten these to a single character, allowing them to more compactly represent builtin functions
    let [slice,map,split,replace,indexOf,empty,negativeOne] = "slice,map,split,replace,indexOf,,-1".split(",");
    // get rid of leading and trailing whitespace
    str = str[replace](/^\s+|\s+$/g,empty);

    // function that splits an object/array by commas, taking into account objects/arrays inside of it
    let splitByCommas = str => str
        [slice](1,negativeOne) // remove leading/trailing brackets 
        [split](empty) // string to array
        .reduce((prev, char) => { // convert the char array to an array of strings, split by commas
            let shouldSplit = 
                !prev[1] // do not split if the recursive depth is greater than 0. We don't want to split nested arrays/objects!
                && !prev[3] // only split if not inside a string literal
                && char == ","; // split at characters
            return [
                [
                    prev[0][slice](0,negativeOne), // previous substrings (split by commas)
                    prev[0][slice](negativeOne)+(shouldSplit?empty:char), // current substring, with potentially another character on it
                    shouldSplit?empty:[] // potentially the next substring
                ].flat(),
                prev[1]+(prev[3]?0:(("{["[indexOf](char)>negativeOne)||-("]}"[indexOf](char)>negativeOne))), // increase recursive depth if encountering an open bracket; decrease if encountering a closed bracket char
                char,    
                (char=='"'&&prev[2]!="\\")?!prev[3]:prev[3]
            ]},[
                [], // prev[0]: array of substrings
                0,  // prev[1]: recursion depth 
                empty, // prev[2]: previous character
                0   // prev[3]: "is inside string?" (boolean)
            ])[0];
    
    // lookup table for JSON types based on the first character in each type.
    let jsonTypeLUTEntry = ({

        // parse object
        "{": _ => Object.fromEntries( // get object from array of key/value pairs
            splitByCommas(str) // split object properties by commas
            [map](e=>{ // for each object property...
                let i = e[replace](/"[^"]*"/g, s=>s[replace](":","a"))[indexOf](":"); // find out where key/value split is
                return [p(e[slice](0,i)),p(e[slice](i+1))] // return key/value pair
            })),

        // parse array
        "[": _ => splitByCommas(str)
            [map](p),
        
        // parse string 
        '"': _ => str[slice](1,negativeOne) // eliminate quotes
            [split]("\\\\") // split by escaped backslashes
            [map](s => s 
                [split]("\\")    // split by escape code
                [map]((s,i) => i?s // ignore first segment (does not start with escape code)
                    [replace](/^(b|f|n|r|t|\/|\")/g,r=>`\b\f\n\r\t\/"`[`bfnrt/"`[indexOf](r)]) // deal with escape codes such as \n
                    [replace](/^u.{4}/g,r=>String.fromCharCode(parseInt(r[slice](1),16))):s // deal with unicode escape codes
                )
                .join(empty)   // join back together
            ).join("\\") // re-add escaped backslashes
            
        // null parser
        ,n:_ => null,
        
        // true parser
        t: _ => !0,
        
        // false parser
        f: _ => !1
    })[str[0]]; // perform lookup
    
    // if lookup succeeded, evalute. If it failed, subtract zero to cast to number
    return jsonTypeLUTEntry ? jsonTypeLUTEntry() : str-0;
}