const removeWhitespaceAndComments = str => {
    str = str.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '') // remove comments
    str = str.replace(/(^\s*)|(\s*$)/gi,"");
	str = str.replace(/[ ]{2,}/gi," ");
    str = str.replace(/\r?\n|\r/g,"");
    return str;
}

const tokenize = str => {
    const operators = [ '{', '}','(', ')', '[', ']', '|', ',', ';']
    const tokens = []

    const words = str.split(' ')
    for (let word of words) {
        if (!word || /^\s*$/.test(word)) continue; //if word is empty
        let current = ""
        for (const c of word) {
            if (operators.indexOf(c) >= 0) {
                if (current !== "") tokens.push(current)
                tokens.push(c)
                current = ""
            } else {
                current += c
            }
        }
        if (current !== "") tokens.push(current)
    }

    return tokens
}

const parseSymbol = (tokens, s) => {
    let [token] = tokens.splice(0, 1)
    if (token !== s)
        throw new Error(`Expected token ${s}, found ${token}`)
    return tokens
}

const parseProperty = tokens => {
    const [propName, propValue, semiColon] = tokens.splice(0,3);

    if (semiColon !== ';') throw new Error(`Expected semi-colon after property declaration, got ${semiColon}.`)

    return {rest: tokens, name: propName, value: propValue}
}

const parseArcStrength = tokens => {
    tokens = parseSymbol(tokens, "arc_strength")
    const [ from, to, strength, semiColon ] = tokens.splice(0,4)

    if (semiColon !== ';') throw new Error(`Expected semi-colon after arc strength, got ${semiColon}.`)

    return { rest: tokens, from, to, strength }
}



const parseListOfValues = (tokens, delimiter, end) => {
    const values = []
    while (tokens[0] !== end) {
        if (tokens[0] === delimiter) {
            tokens = parseSymbol(tokens, delimiter)
        }
        else {
            const [ val ] = tokens.splice(0,1)
            values.push(val)
        }
    }
    return { rest: tokens, values };
}

const parseVariableType = (tokens) => {
    tokens = parseSymbol(tokens, "type")
    const [type] = tokens.splice(0,1)

    tokens = parseSymbol(tokens, "[")
    const [cardinality] = tokens.splice(0,1)
    tokens = parseSymbol(tokens, "]")

    tokens = parseSymbol(tokens, "{")
    const { rest, values } = parseListOfValues(tokens, ",", "}")
    
    tokens = rest;
    tokens = parseSymbol(tokens, "}")
    tokens = parseSymbol(tokens, ";")

    return { rest: tokens, type, cardinality, values }
}

const parseNetworkBlock = (tokens, result) => {
    tokens = parseSymbol(tokens, "network")
    const [networkName] = tokens.splice(0, 1)
    result["network"].name = networkName
    
    // Opening bracket
    tokens = parseSymbol(tokens, "{")

    // Properties of the network
    while (tokens[0] !== "}") {
        if (tokens[0] === 'arc_strength') {
            const { from, to, strength, rest } = parseArcStrength(tokens)
            result.arcStrengths.push(({ from, to, strength }))
            tokens = rest
        } else {
            const { rest, name, value } = parseProperty(tokens)
            result["network"][name] = value
            tokens = rest        
        }
    }
    // Closing bracket
    tokens = parseSymbol(tokens, "}")

    return tokens
}

let idCounter = 0
const parseVariableBlock = (tokens, result) => {
    tokens = parseSymbol(tokens, "variable")
    const [variableName] = tokens.splice(0,1)
    result["nodes"][variableName] = {id: variableName, id_count: idCounter++, parentIds: []}

    //Opening bracket
    tokens = parseSymbol(tokens, "{")
    
    while(tokens[0] !== "}") {
        if (tokens[0] === "type") {
            const { rest, type, cardinality, values } = parseVariableType(tokens)
            result["nodes"][variableName]["type"] = type
            result["nodes"][variableName]["cardinality"] = cardinality
            result["nodes"][variableName]["values"] = values
            tokens = rest
        } else {
            const { rest, name, value } = parseProperty(tokens)
            result["nodes"]["variableName"][name] = value
            tokens = rest;
        }
    }

    tokens = parseSymbol(tokens, "}")
    
    return tokens
}

const parseCPDBlock = (tokens, result) => {
    tokens = parseSymbol(tokens, "probability")
    tokens = parseSymbol(tokens, "(")
    const [ variableName ] = tokens.splice(0,1)
    let parents;
    const theCPD = []
    if (tokens[0] === '|') {
        tokens = parseSymbol(tokens, "|")
        const { values, rest } = parseListOfValues(tokens, ",", ")")
        parents = values;
        for (const p of parents) {
            result["arcs"].push(({from: p, to: variableName}))
            theCPD.push([p])
        }
        tokens = rest;
    } 
    tokens = parseSymbol(tokens, ")")
    tokens = parseSymbol(tokens, "{")
    

    if (tokens[0] === "table") {
        tokens = parseSymbol(tokens, "table")
        const { rest, values } = parseListOfValues(tokens, ",", ";")
        
        theCPD.push([variableName])
        theCPD.push([" ", ...values])

        tokens = rest
        tokens = parseSymbol(tokens, ";")

    } else {
        let firstRow = true
        while (tokens[0] !== "}") {
            tokens = parseSymbol(tokens, "(")
            const res = parseListOfValues(tokens, ",", ")")
            const configuration = res.values
            for (let i in configuration) {
                theCPD[i].push(configuration[i])
            }

            tokens = res.rest
            tokens = parseSymbol(tokens, ")")

            const { rest, values } = parseListOfValues(tokens, ",", ";")
            for (let i = 0; i < values.length; i++) {
                if (firstRow) {
                    theCPD.push([values[i]])
                } else {
                    const index = parseInt(i) + parseInt(configuration.length)
                    theCPD[index].push(values[i])
                }
            }
            
            tokens = rest 
            tokens = parseSymbol(tokens, ";")
            firstRow = false;
        }
    }

    tokens = parseSymbol(tokens, "}")
    result.cpds[variableName] = theCPD
    return tokens
}

export const parseBIFToGraph = bifString => {
    let tokens = tokenize(removeWhitespaceAndComments(bifString))
    const resultObject = { network: {}, nodes: {}, cpds: {}, arcs: [], arcStrengths: [] }
    while (tokens.length > 0) {
        switch(tokens[0]){
            case 'network': 
                tokens = parseNetworkBlock(tokens, resultObject);
                break;
            case 'variable':
                tokens = parseVariableBlock(tokens, resultObject);
                break;
            case 'probability':
                tokens = parseCPDBlock(tokens, resultObject);
                break;
            default:
                throw new Error(`Parsing error: Expected a block type (network|variable|probability), got ${tokens[0]}`)
        }
    }

    for (let {from, to} of resultObject.arcs) {
        resultObject.nodes[to].parentIds.push(from)
    }

    for (let {id, values, parentIds} of Object.values(resultObject.nodes)) {
        const cpd = resultObject.cpds[id]
        if (parentIds.length === 0) {
            cpd[0].push(...values)
        } else {
            for (let i in values) {
                cpd[cpd.length-1-parseInt(i)].unshift(values[values.length-1-i])
            }
        }
    }

    return resultObject;
}