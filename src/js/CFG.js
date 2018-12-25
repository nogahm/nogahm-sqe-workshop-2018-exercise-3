// import * as esgraph from 'esgraph';
const esgraph = require('esgraph');
import * as esprima from 'esprima';

function createCFG(codeToParse,input) {
    // initiate();

    const cfg = esgraph(esprima.parse(codeToParse, { range: true }));
    const dot = esgraph.dot(cfg, { counter: 1, source: codeToParse });

    alert('aaa');
}

export {createCFG}