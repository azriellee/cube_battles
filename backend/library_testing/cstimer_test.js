import cstimer from "cstimer_module";

const scrambles = [];

for (let i=0; i<20; i++) {
    let scrStr = cstimer.getScramble('333');
    scrambles.push(scrStr);
}

console.log(scrambles);