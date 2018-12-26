import * as esgraph from 'esgraph';
import * as viz from 'viz.js';

export {createCFG};
import {oldLines} from "./symbolicSubstitution";
import {globals} from "./code-analyzer";
import * as esprima from "esprima";

let tableIndex=1;
let typeOfStatementMap=new Map();
let graphIndex=1;
let currBloc='';
let currType='';
let CFG=[];
let arr=[];
let finish=false;
let endName=null;
function createCFG(jsonFunc,table, text) {
    initiate();
    // findTableIndex(oldLines);
    let graph=esgraph(jsonFunc.body[0].body);
    graph=esgraph.dot(graph,{counter:0, source:text });
    CFG=graph.split('\n');
    createGraphInfo();
    let str='';
    for(let i=0;i<CFG.length;i++){
        str+=CFG[i]+'\n';
    }

    let x=viz('digraph{'+str+'}');
    return x;
}

function removeExceptions() {
    let i=0;
    while(i<CFG.length){
        let label=getAttribute('label',CFG[i]);
        if(label=='exception')
            CFG.splice(i, 1);
        else
            i++;
    }
}

function startOrEnd(i) {
    let temp=CFG[i];
    if(temp.indexOf('n0 ')==0)
        return true;
    else if(temp.indexOf(endName)==0)
        return true;
    else if(temp.includes('-> n0') || temp.includes('-> '+endName))
        return true;
    return false;
}

function removeStartAndEnd(){
    let i=0;
    while(i<CFG.length){
        if(startOrEnd(i))
            CFG.splice(i, 1);
        else
            i++;
    }
}

function addNumbers() {
    let end=false;
    for(let i=0;i<CFG.length && !end;i++){
        if(CFG[i].includes(' -> '))
            end=true;
        else {
            let newLine=CFG[i];
            let newLabel='('+(i+1)+')\n'+getAttribute('label',CFG[i]);
            newLine=newLine.substring(0,newLine.indexOf('label=')+7)+newLabel+'"'+newLine.substring(newLine.indexOf(','));
            CFG[i]=newLine;
        }
    }
}

function createGraphInfo() {
    while(graphIndex<CFG.length && !finish){
        let type=getLineType(CFG[graphIndex]);
        let func = typeOfStatementMap[type];//what king of expression
        func.call(undefined);
    }
    removeExceptions();
    removeStartAndEnd();
    addNumbers();
}

function initiate() {
    finish=false;
    tableIndex=1;
    graphIndex=1;
    typeOfStatementMap['regular']=regularLine;
    typeOfStatementMap['AssignmentExpression']=regularLine;
    typeOfStatementMap['While Statement']=condition;
    typeOfStatementMap['if statement']=condition;
    typeOfStatementMap['condition']=condition;
    typeOfStatementMap['BinaryExpression']=condition;
    typeOfStatementMap['LogicalExpression']=condition;
    typeOfStatementMap['else statement']=elseLine;
    typeOfStatementMap['return']=returnLine;
    typeOfStatementMap['variable declaration']=regularLine;
    typeOfStatementMap['UpdateExpression']=regularLine;
    typeOfStatementMap['finish']=finishFunc;
    currBloc='';
    currType='';
}

function finishFunc(){
    finish=true;
    endName=CFG[graphIndex].substring(0,CFG[graphIndex].indexOf('['))
    CFG.splice(graphIndex, 1);
}
function addAttribute(attribute, value, str) {
    let ans=str.substring(0,str.indexOf(']'))+', '+attribute+'="'+value+'"]';
    return ans;
}

function getAttribute(attribute, str) {
    let ans=str.substring(str.indexOf(attribute+'=')+attribute.length+2,
        str.indexOf(attribute+'=')+attribute.length+2+
        str.substring(str.indexOf(attribute+'=')+attribute.length+2).indexOf('"'));
    return ans;
}

function handlePointers(name1, name2) {
    for(let i=graphIndex;i<CFG.length;i++){
        let str=CFG[i];
        if(str.includes(name1+'-> '+name2)){//delete
            CFG.splice(i, 1);
        }
        if(str.includes(name2+'->')){
            let newStr=name1+str.substring(str.indexOf(name2)+name2.length);
            CFG[i]=newStr;
        }
    }
}

function mergeNodes() {
    if (getAttribute('label',CFG[graphIndex]).substring(0,4) == 'let ') {
        CFG[graphIndex] = CFG[graphIndex].replace(getAttribute('label',CFG[graphIndex]), getAttribute('label',CFG[graphIndex]).substring(4));
    }
    let newLine=CFG[graphIndex-1];
    let node1=CFG[graphIndex-1]
    let node2=CFG[graphIndex];
    let lable1=getAttribute('label',node1);
    let lable2=getAttribute('label',node2);
    let newLabel=lable1+'\n'+lable2;
    newLine=newLine.substring(0,newLine.indexOf('['))+'[label="'+newLabel+'", shape="box"]';
    CFG[graphIndex-1]=newLine;
    CFG.splice(graphIndex, 1);
    let name1=node1.substring(0,node1.indexOf('['));
    let name2=node2.substring(0,node1.indexOf('['));
    handlePointers(name1,name2);
}

function getLineType(line){
    if(line.includes('let ')){
        return 'regular';
    } else if(line.includes('return ')){
        return 'return';
    }else if(getAttribute('label', line)=='exit')
    {
        return 'finish';
    }
    else{
        let x=esprima.parseScript(getAttribute('label', line));
        return (x.body)[0].expression.type;
    }

}

function regularLine() {
    if (getAttribute('label',CFG[graphIndex]).substring(0,4) == 'let ') {
        CFG[graphIndex] = CFG[graphIndex].replace(getAttribute('label',CFG[graphIndex]), getAttribute('label',CFG[graphIndex]).substring(4));
    }
    CFG[graphIndex]=addAttribute('shape','box',CFG[graphIndex]);
    graphIndex++;
    while(graphIndex<CFG.length && getLineType(CFG[graphIndex])=='regular') {
        mergeNodes();
    }
}

function condition() {
    CFG[graphIndex]=addAttribute('shape','diamond',CFG[graphIndex]);
    graphIndex++;
}

function elseLine() {
    graphIndex++;
}
function returnLine() {
    CFG[graphIndex]=addAttribute('shape','box',CFG[graphIndex]);
    graphIndex++;
}
