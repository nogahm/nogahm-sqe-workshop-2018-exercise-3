import * as esgraph from 'esgraph';

export {createCFG, CFG};
import {colors} from './symbolicSubstitution';
import * as esprima from 'esprima';

// let tableIndex=1;
let typeOfStatementMap=new Map();
let graphIndex=1;
// let currBloc='';
// let currType='';
let CFG=[];
// let arr=[];
let finish=false;
let endName=null;
let colorsArray=[];
let colorsIndex=0;

function createCFG(jsonFunc, text) {
    initiate();
    // findTableIndex(oldLines);
    let graph=esgraph(jsonFunc.body[0].body);
    graph=esgraph.dot(graph,{counter:0, source:text });
    CFG=graph.split('\n');
    createGraphInfo();
    colorGraph();

    let str='';
    for(let i=0;i<CFG.length;i++){
        str+=CFG[i]+'\n';
    }
    return str;

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
        if(CFG[i].includes(' -> ') || CFG[i]=='')
            end=true;
        else {
            let newLine=CFG[i];
            let newLabel='('+(i+1)+')\n'+getAttribute('label',CFG[i]);
            newLine=newLine.substring(0,newLine.indexOf('label=')+7)+newLabel+'"'+newLine.substring(newLine.lastIndexOf(','));
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
    CFG=[];
    graphIndex=1;
    colorsIndex=0;
    colorsArray=[];
    typeOfStatementMap['regular']=regularLine;
    typeOfStatementMap['AssignmentExpression']=regularLine;
    typeOfStatementMap['While Statement']=condition;
    typeOfStatementMap['if statement']=condition;
    typeOfStatementMap['condition']=condition;
    typeOfStatementMap['BinaryExpression']=condition;
    typeOfStatementMap['LogicalExpression']=condition;
    // typeOfStatementMap['else statement']=elseLine;
    typeOfStatementMap['return']=returnLine;
    typeOfStatementMap['variable declaration']=regularLine;
    typeOfStatementMap['UpdateExpression']=regularLine;
    typeOfStatementMap['finish']=finishFunc;
}

function finishFunc(){
    finish=true;
    endName=CFG[graphIndex].substring(0,CFG[graphIndex].indexOf('['));
    CFG.splice(graphIndex, 1);
}
function addAttribute(attribute, value, str) {
    let ans=str.substring(0,str.lastIndexOf(']'))+', '+attribute+'="'+value+'"]';
    return ans;
}

function getAttribute(attribute, str) {
    try{
        let ans=str.substring(str.indexOf(attribute+'=')+attribute.length+2,
            str.indexOf(attribute+'=')+attribute.length+2+
            str.substring(str.indexOf(attribute+'=')+attribute.length+2).indexOf('"'));
        return ans;
    }
    catch(exception){
        return null;
    }

}

function handlePointers(name1, name2) {
    for(let i=graphIndex;i<CFG.length;i++){
        let str=CFG[i];
        if(str.includes(name1+'-> '+name2)){//delete
            CFG.splice(i, 1);
        }
        str=CFG[i];
        if(str.includes(name2+'->')){
            let newStr=name1+str.substring(str.indexOf(name2)+name2.length);
            CFG[i]=newStr;
        }
    }
}

function mergeNodes() {

    if (getAttribute('label',CFG[graphIndex]).substring(0,4) == 'let ') {
        CFG[graphIndex] = CFG[graphIndex].replace(getAttribute('label',CFG[graphIndex]), getAttribute('label',CFG[graphIndex]).substring(4));
    } else
        CFG[graphIndex]=CFG[graphIndex]+'';
    let newLine=CFG[graphIndex-1];
    let node1=CFG[graphIndex-1];
    let node2=CFG[graphIndex];
    let lable1=getAttribute('label',node1);
    let lable2=getAttribute('label',node2);
    let newLabel=lable1+'\n'+lable2;
    newLine=newLine.substring(0,newLine.indexOf('['))+'[label="'+newLabel+'", shape="box"]';
    CFG[graphIndex-1]=newLine;
    CFG.splice(graphIndex, 1);
    let name1=node1.substring(0,node1.indexOf('['));
    let name2=node2.substring(0,node2.indexOf('['));
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

function existLink(index1, index2) {
    let name1=CFG[index1].substring(0,CFG[index1].indexOf(' '));
    let name2=CFG[index2].substring(0,CFG[index2].indexOf(' '));
    let ans=false;
    for(let i=0;i<CFG.length;i++){
        if(CFG[i].includes(name1+' -> '+name2))
            ans= true;
        else if(CFG[i].includes(' -> '+name2))
            return false;
    }
    return ans;
}

function isRegularLine(graphIndex){
    if(((getLineType(CFG[graphIndex])=='regular') || (getLineType(CFG[graphIndex])=='AssignmentExpression')|| (getLineType(CFG[graphIndex])=='UpdateExpression')))
        return true;
    return false;
}

function regularLine() {
    if (getAttribute('label',CFG[graphIndex]).substring(0,4) == 'let ') {
        CFG[graphIndex] = CFG[graphIndex].replace(getAttribute('label',CFG[graphIndex]), getAttribute('label',CFG[graphIndex]).substring(4));
    }
    CFG[graphIndex]=addAttribute('shape','box',CFG[graphIndex]);
    graphIndex++;
    while(graphIndex<CFG.length && existLink(graphIndex-1,graphIndex)&& isRegularLine(graphIndex)){
        mergeNodes();
    }
}

function condition() {
    CFG[graphIndex]=addAttribute('shape','diamond',CFG[graphIndex]);
    if(colors.get(getAttribute('label',CFG[graphIndex]))){
        colorsArray[colorsIndex]=CFG[graphIndex].substring(0,CFG[graphIndex].indexOf(' '));
        colorsIndex++;
    }
    graphIndex++;
}

// function elseLine() {
//     graphIndex++;
// }
function returnLine() {
    CFG[graphIndex]=addAttribute('shape','box',CFG[graphIndex]);
    graphIndex++;
}


function isReturn(cfgIndex) {
    return CFG[cfgIndex].includes('return');
}

//fill color
function colorGraph() {
    let cfgIndex=0;
    // let currNode=CFG[0];
    let pointersIndex=findFirstPointer();
    // let colorsListIndex=0;
    while(pointersIndex<CFG.length && !isReturn(cfgIndex)){
        let choice=isChoice(pointersIndex);
        CFG[cfgIndex]=paintCurr(CFG[cfgIndex]);//we allways paint the curr
        if(!choice){
            cfgIndex=getNextNodeIndex(pointersIndex);
            pointersIndex=getNextPointerIndex(cfgIndex);
        }
        else {//find the next by the condition
            let decision=isTrue(cfgIndex,CFG);
            cfgIndex=getNextNodeIndexDecision(pointersIndex,decision);
            pointersIndex=getNextPointerIndex(cfgIndex);
        }
    }
    CFG[cfgIndex]=paintCurr(CFG[cfgIndex]);
}

function getNextNodeIndexDecision(pointersIndex, decision) {
    let currName=CFG[pointersIndex].substring(0,CFG[pointersIndex].indexOf(' '));
    let currLabel=getAttribute('label',CFG[pointersIndex]);
    let nextNodeName='';
    if(currLabel==decision.toString())
        nextNodeName=CFG[pointersIndex].substring(CFG[pointersIndex].indexOf('-> ')+3,CFG[pointersIndex].indexOf(' ['));
    else {
        for(let i=0;i<CFG.length;i++){
            currLabel=getAttribute('label',CFG[i]);
            if(CFG[i].includes(currName+' -> ') && (currLabel==decision.toString()))
                nextNodeName=CFG[i].substring(CFG[i].indexOf('->')+3,CFG[i].indexOf(' ['));
        }
    }
    return findNodeIndexByName(nextNodeName);
}

function findNodeIndexByName(nextNodeName) {
    for(let i=0;i<CFG.length;i++){
        if(CFG[i].substring(0,CFG[i].indexOf(' '))==nextNodeName)
            return i;
    }
}

function isTrue(cfgIndex,CFG) {
    let name=CFG[cfgIndex].substring(0,CFG[cfgIndex].indexOf(' '));
    for(let i=0;i<colorsArray.length;i++){
        if(name==colorsArray[i])
            return true;
        else
            continue;
    }
    return false;
}

function findFirstPointer() {
    let ans=0;
    while((ans<CFG.length-1) && !CFG[ans].includes(' -> '))
        ans++;
    return ans;
}

//return if it is a desicion point
function isChoice(pointersIndex) {
    let currLabel=getAttribute('label',CFG[pointersIndex]);
    if(currLabel=='true' || currLabel=='false')
        return true;
    else
        return false;
}

function paintCurr(currNode) {
    let ans= addAttribute('style','filled',currNode);
    return addAttribute('fillcolor','green',ans);
}

//return the index of the next node
function getNextNodeIndex(pointersIndex) {
    let nextNodeName=CFG[pointersIndex].substring(CFG[pointersIndex].indexOf('->')+3,CFG[pointersIndex].indexOf(' ['));
    for(let i=0;i<CFG.length;i++){
        if(CFG[i].indexOf(nextNodeName)==0)
            return i;
    }
    return null;//not possible!
}

//get next pointerIndex by the next node
function getNextPointerIndex(nextNodeIndex) {
    try{
        let nextNodeName=CFG[nextNodeIndex].substring(0,CFG[nextNodeIndex].indexOf(' '));
        for(let i=0;i<CFG.length;i++){
            if(CFG[i].includes(nextNodeName+' -> '))
                return i;
        }
        return null;
    } catch(e){
        return null;
    }
}