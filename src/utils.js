import seedrandom from 'seedrandom';

const HSLtoRGB = (h, s, l) => {
    let r, g, b;

    const rd = (a) => {
        return Math.floor(Math.max(Math.min(a*256, 255), 0)); 
    };

    const hueToRGB = (m, n, o) => {
        if (o < 0) o += 1;
        if (o > 1) o -= 1;
        if (o < 1/6) return m + (n - m) * 6 * o;
        if (o < 1/2) return n;
        if (o < 2/3) return m + (n - m) * (2/3 - o) * 6;
        return m;
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hueToRGB(p, q, h + 1/3);
    g = hueToRGB(p, q, h);
    b = hueToRGB(p, q, h - 1/3);

    return [rd(r), rd(g), rd(b)]
}

const RGBtoHex = (r, g, b) => {
    return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

export const randomColor = h => {
    const hBase = Math.random();
    const newL = 60
    
    const [ r, g, b ] = HSLtoRGB(h ? h : hBase, 1, newL*.01);

    return RGBtoHex(r,g,b);
}

// Genarates a Random Hex color
function hexGenerator(seed) {
    var hexNumbers = [ 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D' ]
    const rng = seedrandom(seed);
    const hexValue = ['#'];
    for (var i = 0; i < 6; i += 1) {
        hexValue.push(hexNumbers[Math.floor(rng() * hexNumbers.length)]);
    }

    return hexValue.join('');
}


export const getRandomColors = nodeNames => {
    return nodeNames.map(hexGenerator);
}