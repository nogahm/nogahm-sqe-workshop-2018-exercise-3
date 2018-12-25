import {parseInfo,globals,functionCodeOnly} from './code-analyzer';
import * as esprima from 'esprima';

let argsVars=new Map();
let newLines=[];
let oldLines=[];
let newLineCounter=0;
let oldLinesCounter=0;
let tableLinesCounter=1;
let typeToHandlerMapping=new Map();
let mathOperatorsMap=new Map();
let operatorsMap=new Map();
let typeToHandlerMappingColor=new Map();
let colors=new Map();

function functionAfterSubs(codeToParse,input) {
    initiate();
    initiateMap();
    initiateMapColor();
    saveFuncArgs(input);
    saveGlobals();
    let temp=functionCodeOnly.replace(new RegExp('}', 'g'),'}\n');
    oldLines=temp.split('\n');
    substitute(new Map());
    // alert('aaaaaaaa');
}

function initiate() {
    argsVars=new Map();
    newLines=[];
    oldLines=[];
    newLineCounter=0;
    oldLinesCounter=0;
    tableLinesCounter=1;
    typeToHandlerMapping=new Map();
    mathOperatorsMap=new Map();
    operatorsMap=new Map();
    typeToHandlerMappingColor=new Map();
    colors=new Map();
}
function initiateMap() {
    typeToHandlerMapping=new Map(); typeToHandlerMapping['variable declaration']=varDeclaration;
    typeToHandlerMapping['assignment expression']=varAssignment;
    typeToHandlerMapping['While Statement']=condition;
    typeToHandlerMapping['if statement']=condition;
    typeToHandlerMapping['else if statement']=condition;
    typeToHandlerMapping['else statement']=copyAsIs;
    typeToHandlerMapping['return statement']=returnStatement;
    typeToHandlerMapping['BinaryExpression']=BinaryExpression;//expressions
    typeToHandlerMapping['LogicalExpression']=BinaryExpression;//expressions
    typeToHandlerMapping['Identifier']=Identifier;
    typeToHandlerMapping['Literal']=Literal;
    typeToHandlerMapping['UnaryExpression']=UnaryExpression;
    typeToHandlerMapping['MemberExpression']=MemberExpression;
    typeToHandlerMapping['ArrayExpression']=ArrayExpression;
    mathOperatorsMap['+']=plus;//operators
    mathOperatorsMap['-']=minus;
    mathOperatorsMap['*']=multi;
    mathOperatorsMap['/']=divide;
}
export {functionAfterSubs,colors};
export {newLines};

function checkIfOnlyOneInArray(var1) {
    if(var1.charAt(0)=='[' && var1.charAt(var1.length-1)==']')
        return true;
    else
        return false;
}

//extract from parseInfo all function args
function saveFuncArgs(input) {
    let temp=0;
    input=input.replace(/\s/g, '');
    let vars=input.split(',');
    for(let i=1;i<parseInfo.length;i++) {
        if(parseInfo[i].Line>1) return;
        if(vars[temp].charAt(0)=='['){//check for array
            checkIfOnlyOneInArray(vars[temp]);
            let arr=[];
            let index=0; //arr index
            index=findAllArr(temp,vars,arr,index);
            // arr[index]=returnValue(vars[temp].slice(0, -1));
            // temp++;
            // index++;
            temp+=index;
            argsVars.set(parseInfo[i].Name, arr);}
        else{
            argsVars.set(parseInfo[i].Name, returnValue(vars[temp]));
            temp++;}}
}

function returnValue(var1) {
    if(var1=='true' || var1=='false')
        return JSON.parse(var1);
    else if(isString(var1))
        return var1.slice(1,-1);
    else
        return var1;
}

function isString(var1){
    return (var1.charAt(0)=='\'' && var1.charAt(var1.length-1)=='\'') || (var1.charAt(0)=='"' && var1.charAt(var1.length-1)=='"');
}

function handleCurrArr(temp, vars, arr, index) {
    while(temp<vars.length){
        if((vars[temp].charAt(0)=='[')){
            arr[index]=returnValue(vars[temp].substring(1));
            temp++;
            index++;
        } else if(vars[temp].charAt(vars[temp].length-1)==']'){
            arr[index]=returnValue(vars[temp].slice(0,-1));
            temp++;
            index++;
            return index;
        }
        else{
            arr[index]=returnValue(vars[temp]);
            temp++;
            index++;
        }
    }
    // return index;
}

function findAllArr(temp,vars,arr,index){
    //start
    if(checkIfOnlyOneInArray(vars[temp]))
        arr[index]=returnValue(vars[temp].slice(1,-1));
    else {
        index=handleCurrArr(temp,vars,arr,index);
    }
    return index;
}

//go throw globals
function saveGlobals() {
    for(let i=0;i<globals.length;i++){
        // let temp=globals[i].replace(/\s/g, '');
        // if(!temp.length)
        //     continue;
        let x = esprima.parseScript(globals[i]+'');
        if(x.body.length>0 &&(x.body)[0].type=='VariableDeclaration'){
            let name=(x.body)[0].declarations[0].id;
            let func = typeToHandlerMapping[(x.body)[0].declarations[0].init.type];//what king of expression
            let value = func.call(undefined, (x.body)[0].declarations[0].init);
            argsVars.set(name.name,value);
        }
        else
            continue;
    }
}


function substituteBlock(localVars,endOfScopeLine) {
    while(oldLinesCounter<=endOfScopeLine) {
        let temp=oldLines[oldLinesCounter];
        temp=temp.replace(/\s/g, '');
        if((temp=='}') || (temp=='{') || !(temp.length)){//if line not in table
            // newLines[newLineCounter]=oldLines[oldLinesCounter];
            // newLineCounter++;
            copyAsIs(localVars);
            oldLinesCounter++;
        }
        else{
            handleTableLine(localVars);
        }
        checkIfSubstitute(endOfScopeLine,localVars);
    }
}

function checkIfSubstitute(endOfScopeLine,localVars){
    if(oldLinesCounter<=endOfScopeLine && oldLines[oldLinesCounter].includes('{'))
        substitute(localVars);
    else
        return;
}

//go throw code lines and substitute
function substitute(localVars) {
    while(oldLinesCounter<oldLines.length){
        let newlocalVars=new Map(localVars);
        let endOfScopeLine=findEndOfScopeLine();
        substituteBlock(newlocalVars,endOfScopeLine);
    }
}
//start from oldLinesCounter - find end of scope by { }
function findEndOfScopeLine() {
    let openCount=updateFirstCounter(0);
    if(openCount==0)
        return oldLinesCounter;
    for(let i=oldLinesCounter+1;i<oldLines.length;i++){
        openCount=checkSoger(i,openCount);
        if(openCount==0)
            return i;
        else
            openCount=checkPoteach(i,openCount);
    }
    return oldLines.length-1;
}

function updateFirstCounter(openCount){
    if(oldLines[oldLinesCounter].includes('{'))
        openCount++;
    if(oldLines[oldLinesCounter].includes('}') && (oldLines[oldLinesCounter].indexOf('}'))>(oldLines[oldLinesCounter].indexOf('{')))
        openCount--;
    return openCount;
}

function checkPoteach(i,openCount) {
    if(oldLines[i].includes('{'))
        openCount++;
    return openCount;
}
function checkSoger(i,openCount){
    if(oldLines[i].includes('}'))
        openCount--;
    return openCount;
}

function getTabs() {
    for(let i=0;i<oldLines[oldLinesCounter].length;i++){
        if(oldLines[oldLinesCounter].charAt(i)!='\t' && oldLines[oldLinesCounter].charAt(i)!=' '){
            return oldLines[oldLinesCounter].substring(0,i);
        }
        else
            continue;
    }
}

//given a "line" in table - check if needed to substitute/add to locals/ad as is to newLines
function handleTableLine(localVars) {
    if(tableLinesCounter==1) //function header
        copyAsIs(localVars);
    else {
        let currTableLines=getLinesFromParseInfo();
        handleLineFromTable(currTableLines,localVars);

    }
    oldLinesCounter++;
    tableLinesCounter++;
}

function tempFuncCurrLine(currTableLines, i, localVars) {
    if(currTableLines[i].Type=='update expression'){
        currTableLines[i].Value=currTableLines[i].Value.substring(0,currTableLines[i].Value.length-1)+'1';
        return varAssignment(currTableLines[i],localVars);
    }else{
        let func = typeToHandlerMapping[currTableLines[i].Type];
        return func.call(undefined, currTableLines[i],localVars);
    }}

function handleLineFromTable(currTableLines,localVars) {
    for (let i=0;i<currTableLines.length;i++){
        let xxx=tempFuncCurrLine(currTableLines,i,localVars);
        if(currTableLines[i].Type!='variable declaration' && currTableLines[i].Type!='assignment expression' && xxx!=undefined){
            newLines[newLineCounter]=xxx;
            newLineCounter++;
        }
    }
}

//not adding to newLines - only save vars
function varDeclaration(currItem,localVars) {
    let newVal = checkForLocals(currItem.Value,localVars);
    localVars.set((currItem.Name), newVal);
}

function findExplicitVal(localVars,Value) {
    let x = esprima.parseScript(Value+'');
    let func = typeToHandlerMappingColor[(x.body)[0].expression.type];//what king of expression
    let ans= func.call(undefined,localVars, (x.body)[0].expression);
    return ans;
}

function handleArrAssignment(x,localVars,newVal) {
    let arrName=x.object.name;
    let func = typeToHandlerMappingColor[x.property.type];//what king of expression
    let index= func.call(undefined,localVars, x.property);
    index=checkForLocals(index, localVars);
    index=findExplicitVal(localVars,index);
    newVal=findExplicitVal(localVars,newVal);
    if(argsVars.has(arrName)){//global array
        argsVars.get(arrName)[index]=newVal;
        newLines[newLineCounter] = getTabs() + arrName+' [ '+index+' ] ' + '=' + newVal + ';';
        newLineCounter++;
    } else {//local array
        localVars.get(arrName)[index]= newVal;}
}

function varAssignment(currItem,localVars) {
    let newVal = checkForLocals(currItem.Value, localVars);
    let x=esprima.parseScript(currItem.Name+'').body[0].expression;//left
    if(x.type=='MemberExpression'){//array
        handleArrAssignment(x,localVars,newVal);
    }
    else if (argsVars.has(currItem.Name)) {//is global
        argsVars.set(currItem.Name, findExplicitVal(localVars,newVal));
        newLines[newLineCounter] = getTabs() + currItem.Name + '=' + newVal + ';';
        newLineCounter++;
    } else {//local var
        localVars.set(currItem.Name, newVal);
    }
}

//while or if or if else
function condition(currItem,localVars) {
    let newCondition = checkForLocals(currItem.Condition,localVars);
    let oldLine=oldLines[oldLinesCounter];
    // let newLine=oldLine.replace(/ *\([^)]*\) */, '('+newCondition+')');
    let newLine=oldLine.substring(0,oldLine.indexOf('(')+1)+newCondition+oldLine.substring(oldLine.lastIndexOf(')'),oldLine.length);
    if(currItem.Type=='if statement' || currItem.Type=='else if statement'){
        findColor(localVars,newCondition);
    }
    return newLine;
    // newLines[newLineCounter]=newLine;
    // newLineCounter++;
}

function returnStatement(value,localVars)
{
    return getTabs()+'return ' + checkForLocals(value.Value,localVars)+';';
}

function checkForLocals(Value,localVars) {
    if(Value=='null(or nothing)')
        return;
    else {
        let x = esprima.parseScript(Value+'');
        let func = typeToHandlerMapping[(x.body)[0].expression.type];//what king of expression
        return func.call(undefined, (x.body)[0].expression,localVars);
    }
}

function BinaryExpression(expression,localVars)
{
    let left=expression.left;
    let right=expression.right;
    left=binaryOneSide(left,localVars);
    right=binaryOneSide(right,localVars);
    //calculate if possible
    let res=calculate(left,right,expression.operator);
    if(res==null) {
        if (expression.operator == '*' || expression.operator == '/')
            return '(' + left + ') ' + expression.operator + ' ' + right;
        else
            return left + ' ' + expression.operator + ' ' + right;
    }else
        return res;
}

//check for zeros or only numbers
function calculate(left, right, operator) {
    let leftNum=Number(left);
    let rightNum=Number(right);
    //(!isNaN(leftNum) || !isNaN(rightNum)) &&
    // if(mathOperatorsMap.has(operator+'')){
    let func = mathOperatorsMap[operator];
    if (func!=undefined)
        return func.call(undefined,leftNum,rightNum,left,right);
    else
        return null;

}

function plus(leftNum,rightNum,left,right) {
    if(leftNum==0)
        return right;
    else if(rightNum==0)
        return left;
    else if((isNaN(leftNum) || isNaN(rightNum)))
        return null;
    else
        return leftNum+rightNum;
}
function minus(leftNum,rightNum,left,right) {
    if(rightNum==0 && right!=null)
        return left;
    else if((isNaN(leftNum) || isNaN(rightNum)))
        return null;
    else
        return leftNum-rightNum;
}
function multi(leftNum,rightNum,left,right) {
    if(!(isNaN(leftNum)) && !(isNaN(rightNum)) &&(left!=null && right!=null))
        return leftNum*rightNum;
    else
        return null;
}
function divide(leftNum,rightNum,left,right) {
    if(!(isNaN(leftNum) && isNaN(rightNum)) &&(left!=null && right!=null))
        return leftNum/rightNum;
    else
        return null;
}

function binaryOneSide(left,localVars) {
    let func = typeToHandlerMapping[left.type];
    let temp= func.call(undefined,left,localVars);
    if(left.type==('BinaryExpression'))
        left=''+temp;
    else
        left=temp;
    return left;
}

//var
function Identifier(value,localVars)
{
    if(localVars.has(value.name))
        return localVars.get(value.name);
    else
        return value.name;
}

function Literal(value,localVars)
{
    if(localVars==null)
        return value.raw;
    else
        return value.raw;
}

function UnaryExpression(value,localVars)
{
    let func = typeToHandlerMapping[value.argument.type];
    let newVal= func.call(undefined,value.argument,localVars);
    return value.operator+' '+newVal;
}

function MemberExpression(value,localVars)
{
    let func = typeToHandlerMapping[value.property.type];
    let indexVal= func.call(undefined,value.property,localVars);
    if(indexVal=='length')
        return value.object.name+'.length';
    else if(argsVars.has(indexVal))
        indexVal=argsVars.get(indexVal);
    if(localVars.has(value.object.name))
        return localVars.get(value.object.name)[indexVal];
    else
        return value.object.name+' [ '+indexVal+' ] ';
}

function ArrayExpression(value,localVars)
{
    let ans=[];
    for(let i=0;i<value.elements.length;i++){
        let func = typeToHandlerMapping[value.elements[i].type];
        ans[i]= func.call(undefined,value.elements[i],localVars);
    }
    return ans;
}

//copy from old to new as is (by counters)
function copyAsIs(localVars) {
    let temp=oldLines[oldLinesCounter];
    if(!temp.replace(/\s/g, '').length && localVars!=null)
        return;
    else {
        newLines[newLineCounter]=oldLines[oldLinesCounter];
        newLineCounter++;
    }

}

//returns all lines from table with "Line" value of tableLinesCounter
function getLinesFromParseInfo() {
    let ans=[];
    for(let i=0;i<parseInfo.length;i++)
    {
        if(parseInfo[i].Line>tableLinesCounter)
            return ans;
        else {
            if(parseInfo[i].Line==tableLinesCounter)
                ans.push(parseInfo[i]);}
    }
    return ans;
}

//get line and find&return color
function findColor(localVars,condition) {
    let x = esprima.parseScript(condition+'');
    let func = typeToHandlerMappingColor[(x.body)[0].expression.type];//what king of expression
    let ans= func.call(undefined,localVars, (x.body)[0].expression);
    colors.set(newLineCounter,ans);
}

function initiateMapColor() {
    typeToHandlerMappingColor=new Map();
    //expressions
    typeToHandlerMappingColor['BinaryExpression']=BinaryExpressionC;
    typeToHandlerMappingColor['LogicalExpression']=BinaryExpressionC;
    typeToHandlerMappingColor['Identifier']=IdentifierC;
    typeToHandlerMappingColor['Literal']=LiteralC;
    typeToHandlerMappingColor['UnaryExpression']=UnaryExpressionC;
    typeToHandlerMappingColor['MemberExpression']=MemberExpressionC;
    operatorsMap['<']=smaller;//operators
    operatorsMap['>']=bigger;
    operatorsMap['<=']=smallerEq;
    operatorsMap['>=']=biggerEq;
    operatorsMap['==']=equal;
    operatorsMap['!=']=notEqual;
    operatorsMap['||']=or;
    operatorsMap['&&']=and;
}

function BinaryExpressionC(localVars,expression)
{
    let left=expression.left;
    let right=expression.right;
    left=binaryOneSideC(localVars,left);
    right=binaryOneSideC(localVars,right);
    //calculate if possible
    let res=calculate(left,right,expression.operator);
    let func = operatorsMap[expression.operator];
    if(res==null && func!=undefined) {
        return func.call(undefined,left,right);}
    else
        return res;
}

function smaller(left,right) {
    return left<right;
}
function bigger(left,right) {
    return left>right;
}
function smallerEq(left,right) {
    return left<=right;
}
function biggerEq(left,right) {
    return left>=right;
}
function equal(left,right) {
    return left==right;
}
function notEqual(left,right) {
    return left!=right;
}
function or(left,right) {
    return left||right;
}
function and(left,right) {
    return left&&right;
}

function binaryOneSideC(localVars,left) {
    let func = typeToHandlerMappingColor[left.type];
    let temp= func.call(undefined,localVars,left);
    return temp;
}

//var
function IdentifierC(localVars,value)
{
    if(localVars.has(value.name))
        return localVars.get(value.name);
    else
        return argsVars.get(value.name);
}

function LiteralC(localVars,value)
{
    return value.value;
}

function UnaryExpressionC(localVars,value)
{
    let func = typeToHandlerMappingColor[value.argument.type];
    let newVal= func.call(undefined,localVars,value.argument);
    if(value.operator=='!')
        return !newVal;
    else
        return calculate('0',newVal,value.operator);
}

function MemberExpressionC(localVars,value)
{
    let func = typeToHandlerMappingColor[value.property.type];
    let indexVal=value.property.name;
    if(indexVal==undefined || !indexVal=='length')
        indexVal= func.call(undefined,localVars,value.property);

    // if(argsVars.has(value.object.name)) {
    if (indexVal == 'length')
        return (argsVars.get(value.object.name)).length;
    else
        return (argsVars.get(value.object.name))[indexVal];
    // }
    // else
    //     return null;
}