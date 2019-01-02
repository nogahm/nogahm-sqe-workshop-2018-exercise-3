
import assert from 'assert';
import {parseCode, parseInfo, createParseInfo} from '../src/js/code-analyzer';
import {functionAfterSubs,newLines} from '../src/js/symbolicSubstitution';
import {CFG, createCFG} from '../src/js/CFGCreator';
import $ from "jquery";
import * as viz from 'viz.js';

// describe('The javascript parser', () => {
//     it('is parsing an empty function correctly', () => {
//         assert.equal(
//             JSON.stringify(parseCode('')),
//             '{"type":"Program","body":[],"sourceType":"script"}'
//         );
//     });
//
//     // it('is parsing a simple variable declaration correctly', () => {
//     //     assert.equal(
//     //         JSON.stringify(parseCode('let a = 1;')),
//     //         '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a"},"init":{"type":"Literal","value":1,"raw":"1"}}],"kind":"let"}],"sourceType":"script"}'
//     //     );
//     // });
// });

describe('save info and create table',()=>{

    it('code with no func decleration', ()=>{
        let text=parseCode('let x;');
        let msg=createParseInfo(text);
        assert.deepEqual('Illigal input',msg);
    });

    // it('return inside function', ()=>{
    //     let text=parseCode('function x() {\n' +
    //         '    return 0;\n' +
    //         '}');
    //     createParseInfo(text);
    //     let expRes=[{Line:'1', Type:'function declaration', Name:'x', Condition:'', Value:''},
    //         {Line:'2', Type:'return statement', Name:'', Condition:'', Value:'0'}];
    //     assert.deepEqual(expRes,parseInfo);
    // });

    it('function with var assign', ()=>{
        let code='function x(a){\nlet b=a;\n}\nlet y=0;';
        let vars='1';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i];
        }
        assert.deepEqual('function x(a){}',ans);
    });

    it('another function with arg array-string compare',()=> {
        let code = 'function x(a,b){\n' +
            'if(a[0]=="a" && b==1){\n' +
            'return "a";\n' +
            '}\n' +
            '}';
        let vars = '[\'a\',false],0';
        let temp = parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp, vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual('function x(a,b){\n' +
            'if(a [ 0 ]  == "a" && b == 1){\n' +
            'return "a";\n' +
            '}\n' +
            '}\n', ans);
    });

    it('function with global array', ()=>{
        let code='let a=[true];\n' +
            'function x(){\n' +
            'let b=0;\n' +
            'if(a[b]){\n' +
            '\treturn "a";\n' +
            '\n'+
            '}\n' +
            '}'+'\n   ';
        let vars='';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(){\n' +
            'if(a [ 0 ] ){\n' +
            '\treturn "a";\n' +
            '}\n' +
            '}\n');
    });

    it('arg array one item-string', ()=>{
        let code= 'function x(a){\n' +
            'if(a[0]==\'a\'){\n' +
            'return true;\n' +
            '}\n' +
            '}';
        let vars='["a"]';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a){\n' +
            'if(a [ 0 ]  == \'a\'){\n' +
            'return true;\n' +
            '}\n' +
            '}\n');
    });
    it('arg array three item-string and unary exp', ()=>{
        let code= 'function x(a){\n' +
            'if(a[0]==\'a\'){\n' +
            'return -1;\n' +
            '}\n' +
            '}';
        let vars='["a",1,true]';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a){\n' +
            'if(a [ 0 ]  == \'a\'){\n' +
            'return - 1;\n' +
            '}\n' +
            '}\n');
    });

    it('no globals but enter', ()=>{
        let code= '\nfunction x(a){\n' +
            '}';
        let vars='"a"';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a){\n' +
            '}\n');
    });

    it('var assignment with locals', ()=>{
        let code= 'function x(a,b){\n' +
            'let b=a;\n' +
            'let c;\n' +
            'c=b;\n' +
            'b=c;\n' +
            '}';
        let vars='"a",1';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a,b){\n' +
            'b=a;\n'+
            '}\n');
    });

    it('using multiple', ()=>{
        let code= 'function x(a,b){\n' +
            'let x=a*b;\n' +
            '}';
        let vars='2,1';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a,b){\n' +
            '}\n');
    });

    it('calculate plus', ()=>{
        let code= 'function x(){\n' +
            'let x=1+2;\n' +
            '}';
        let vars='';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(){\n' +
            '}\n');
    });

    it('zeros and not computable-all operators', ()=>{
        let code= 'function x(a,b){\n' +
            'let x=0+a;\n' +
            'x=a+0;\n'+
            'x=0+a;\n'+
            'x=a+b;\n'+
            'x=a-0;\n'+
            'x=a-b;\n'+
            'x=3-2;\n'+
            'x=2*3;\n'+
            'x=a*3;\n'+
            'x=2*a;\n'+
            'x=b*a;\n'+
            'x=2/3;\n'+
            'x=a/3;\n'+
            'x=2/a;\n'+
            'x=b/a;\n'+
            '}';
        let vars='2,9';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a,b){\n' +
            '}\n');
    });

    it('array.length', ()=>{
        let code= 'function x(a){\n' +
            'if(a.length==3){\n' +
            'return \'a\';\n' +
            '}\n' +
            '}';
        let vars='["a",1,true]';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a){\n' +
            'if(a.length == 3){\n' +
            'return \'a\';\n' +
            '}\n' +
            '}\n');
    });

    it('arg index and local index', ()=>{
        let code= 'function x(a,b){\n' +
            'let c=0;\n' +
            'a[c]=a[b];\n' +
            'if(a[c]==3)\n' +
            'return true;\n' +
            '}';
        let vars='[1,2,3],2';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a,b){\n' +
            'a [ 0 ] =3;\n' +
            'if(a [ 0 ]  == 3)\n' +
            'return true;\n' +
            '}\n');
    });

    it('local arr assignment', ()=>{
        let code= 'function x(a,b){\n' +
            'let c=[1,2,3];\n' +
            'c[a]=c[b];\n' +
            '}';
        let vars='0,2';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a,b){\n' +
            '}\n');
    });

    it('calculate result in if', ()=>{
        let code= 'function x(a){\n' +
            'if(a==(3-a))\n' +
            'return true;\n' +
            '}';
        let vars='0';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a){\n' +
            'if(a == 3 - a)\n' +
            'return true;\n'+
            '}\n');
    });

    it('all operators in calc', ()=> {
        let code = 'function x(a, b){\n' +
            'if(a< b)\n' +
            'return 1;\n' +
            'else if(a>b)\n' +
            'return 1;\n' +
            'else if(a<=b)\n' +
            'return 1;\n' +
            'else if((a>=b) || (a!=b))\n' +
            'return 1;\n' +
            '}';
        let vars = '0,1';
        let temp = parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp, vars);
        let ans = '';
        for (let i = 0; i < newLines.length; i++) {
            ans += newLines[i] + '\n';
        }
        assert.deepEqual(ans, 'function x(a, b){\n' +
            'if(a < b)\n' +
            'return 1;\n' +
            'else if(a > b)\n' +
            'return 1;\n' +
            'else if(a <= b)\n' +
            'return 1;\n' +
            'else if(a >= b || a != b)\n' +
            'return 1;\n' +
            '}\n');
    });

    it('unary arg', ()=> {
        let code = 'function x(a){\n' +
            'if(-a<0)\n' +
            'return 1;\n' +
            '}';
        let vars = '1';
        let temp = parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp, vars);
        let ans = '';
        for (let i = 0; i < newLines.length; i++) {
            ans += newLines[i] + '\n';
        }
        assert.deepEqual(ans, 'function x(a){\n' +
            'if(- a < 0)\n' +
            'return 1;\n' +
            '}\n');
    });

    it('else', ()=> {
        let code = 'function x(a){\n' +
            'if(-a<0)\n' +
            'return 1;\n' +
            'else\n'+
            'return 0;\n'+
            '}';
        let vars = '1';
        let temp = parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp, vars);
        let ans = '';
        for (let i = 0; i < newLines.length; i++) {
            ans += newLines[i] + '\n';
        }
        assert.deepEqual(ans, 'function x(a){\n' +
            'if(- a < 0)\n' +
            'return 1;\n' +
            'else\n'+
            'return 0;\n'+
            '}\n');
    });


    it('else in block', ()=> {
        let code = 'function x(a){\n' +
            'if(-a<0)\n' +
            'return 1;\n' +
            'else{\n'+
            'return 0;\n'+
            '}\n'+
            '}';
        let vars = '1';
        let temp = parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp, vars);
        let ans = '';
        for (let i = 0; i < newLines.length; i++) {
            ans += newLines[i] + '\n';
        }
        assert.deepEqual(ans, 'function x(a){\n' +
            'if(- a < 0)\n' +
            'return 1;\n' +
            'else{\n'+
            'return 0;\n'+
            '}\n'+
            '}\n');
    });

    it('while', ()=> {
        let code = 'function x(a){\n' +
            'while(-a<0){\n' +
            'a=a+1;\n' +
            '}\n'+
            '}';
        let vars = '1';
        let temp = parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp, vars);
        let ans = '';
        for (let i = 0; i < newLines.length; i++) {
            ans += newLines[i] + '\n';
        }
        assert.deepEqual(ans, 'function x(a){\n' +
            'while(- a < 0){\n' +
            'a=a + 1;\n' +
            '}\n'+
            '}\n');
    });

    it('not', ()=> {
        let code = 'function foo(x){\n' +
            'if(!x)\n' +
            'return x;\n' +
            '}';
        let vars = 'true';
        let temp = parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp, vars);
        let ans = '';
        for (let i = 0; i < newLines.length; i++) {
            ans += newLines[i] + '\n';
        }
        assert.deepEqual(ans, 'function foo(x){\n' +
            'if(! x)\n' +
            'return x;\n' +
            '}\n');
    });

    it('update arg', ()=> {
        let code = 'function foo(x){\n' +
            'x++;\n' +
            'if(x==0)\n' +
            'return x;\n' +
            '}';
        let vars = '0';
        let temp = parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp, vars);
        let ans = '';
        for (let i = 0; i < newLines.length; i++) {
            ans += newLines[i] + '\n';
        }
        assert.deepEqual(ans, 'function foo(x){\n' +
            'x=x + 1;\n' +
            'if(x == 0)\n' +
            'return x;\n' +
            '}\n');
    });

    it('check graph', ()=> {
        let codeToParse = 'function foo(x){\n' +
            'x++;\n' +
            'if(x>0)\n' +
            'return x;\n' +
            '}';
        let input = '0';
        let parsedCode = parseCode(codeToParse);
        createParseInfo(parsedCode);
        functionAfterSubs(codeToParse,input);
        let ans = createCFG(parsedCode, codeToParse);

        let wantedAns='n1 [label="(1)\n'+'x++", shape="box", style="filled", fillcolor="green"]\n'+
            'n2 [label="(2)\n'+'x>0", shape="diamond", style="filled", fillcolor="green"]\n'+
            'n3 [label="(3)\n'+'return x;", shape="box", style="filled", fillcolor="green"]\n'+
            'n1 -> n2 []\n'+
            'n2 -> n3 [label="true"]'+ '\n\n';
        assert.deepEqual(ans, wantedAns);
    });

    it('check graph only return', ()=> {
        let codeToParse = 'function foo(){\n' +
            'return 0;\n' +
            '}';
        let input = '';
        let parsedCode = parseCode(codeToParse);
        createParseInfo(parsedCode);
        functionAfterSubs(codeToParse,input);
        let ans = createCFG(parsedCode, codeToParse);

        let wantedAns='n1 [label="(1)\n'+'return 0;", shape="box", style="filled", fillcolor="green"]\n'+
           '\n';
        assert.deepEqual(ans, wantedAns);
    });

    it('check graph merge', ()=> {
        let codeToParse = 'function foo(z){\n' +
            'let x=0;\n'+
            'z=1;\n'+
            'let y=0;\n'+
            'return 0;\n' +
            '}';
        let input = '0';
        let parsedCode = parseCode(codeToParse);
        createParseInfo(parsedCode);
        functionAfterSubs(codeToParse,input);
        let ans = createCFG(parsedCode, codeToParse);

        let wantedAns='n1 [label="(1)\n'+'x=0;\nz=1\ny=0;", shape="box", style="filled", fillcolor="green"]\n'+
            'n4 [label="(2)\n'+'return 0;", shape="box", style="filled", fillcolor="green"]\n'+
            'n1 -> n4 []\n'+
            '\n';
        assert.deepEqual(ans, wantedAns);
    });

    it('check graph if else', ()=> {
        let codeToParse = 'function foo(){\n' +
            'if(1==1){\n'+
            'let y=1;}\n'+
            'else{\n'+
            'let y=0;}\n'+
            'return y;\n' +
            '}';
        let input = '';
        let parsedCode = parseCode(codeToParse);
        createParseInfo(parsedCode);
        functionAfterSubs(codeToParse,input);
        let ans = createCFG(parsedCode, codeToParse);

        let wantedAns='n1 [label="(1)\n'+'1==1", shape="diamond", style="filled", fillcolor="green"]\n'+
            'n2 [label="(2)\n'+'y=1;", shape="box", style="filled", fillcolor="green"]\n'+
            'n3 [label="(3)\n'+'return y;", shape="box", style="filled", fillcolor="green"]\n'+
            'n4 [label="(4)\n'+'y=0;", shape="box"]\n'+
            'n1 -> n2 [label="true"]\n'+
            'n1 -> n4 [label="false"]\n'+
            'n2 -> n3 []\n'+
            'n4 -> n3 []\n'+
            '\n';
        assert.deepEqual(ans, wantedAns);
    });

    it('check graph if else-false', ()=> {
        let codeToParse = 'function foo(){\n' +
            'if(1==0){\n'+
            'let y=1;}\n'+
            'else{\n'+
            'let y=0;}\n'+
            'return y;\n' +
            '}';
        let input = '';
        let parsedCode = parseCode(codeToParse);
        createParseInfo(parsedCode);
        functionAfterSubs(codeToParse,input);
        let ans = createCFG(parsedCode, codeToParse);

        let wantedAns='n1 [label="(1)\n'+'1==0", shape="diamond", style="filled", fillcolor="green"]\n'+
            'n2 [label="(2)\n'+'y=1;", shape="box"]\n'+
            'n3 [label="(3)\n'+'return y;", shape="box", style="filled", fillcolor="green"]\n'+
            'n4 [label="(4)\n'+'y=0;", shape="box", style="filled", fillcolor="green"]\n'+
            'n1 -> n2 [label="true"]\n'+
            'n1 -> n4 [label="false"]\n'+
            'n2 -> n3 []\n'+
            'n4 -> n3 []\n'+
            '\n';
        assert.deepEqual(ans, wantedAns);
    });

    it('check graph two if -one true other false', ()=> {
        let codeToParse = 'function foo(){\n' +
            'if(1==0){\n'+
            'let y=1;}\n'+
            'if(1==1){\n'+
            'let y=0;}\n'+
            'return y;\n' +
            '}';
        let input = '';
        let parsedCode = parseCode(codeToParse);
        createParseInfo(parsedCode);
        functionAfterSubs(codeToParse,input);
        let ans = createCFG(parsedCode, codeToParse);

        let wantedAns='n1 [label="(1)\n'+'1==0", shape="diamond", style="filled", fillcolor="green"]\n'+
            'n2 [label="(2)\n'+'y=1;", shape="box"]\n'+
            'n3 [label="(3)\n'+'1==1", shape="diamond", style="filled", fillcolor="green"]\n'+
            'n4 [label="(4)\n'+'y=0;", shape="box", style="filled", fillcolor="green"]\n'+
            'n5 [label="(5)\n'+'return y;", shape="box", style="filled", fillcolor="green"]\n'+
            'n1 -> n2 [label="true"]\n'+
            'n1 -> n3 [label="false"]\n'+
            'n2 -> n3 []\n'+
            'n3 -> n4 [label="true"]\n'+
            'n3 -> n5 [label="false"]\n'+
            'n4 -> n5 []\n'+
            '\n';
        assert.deepEqual(ans, wantedAns);
    });

    it('check graph arr', ()=> {
        let codeToParse = 'function foo(z){\n' +
            'let x=0;\n'+
            'z[0]=x;\n'+
            'let y=0;\n'+
            'return 0;\n' +
            '}';
        let input = '[1,2,3]';
        let parsedCode = parseCode(codeToParse);
        createParseInfo(parsedCode);
        functionAfterSubs(codeToParse,input);
        let ans = createCFG(parsedCode, codeToParse);

        let wantedAns='n1 [label="(1)\n'+'x=0;\nz[0]=x\ny=0;", shape="box", style="filled", fillcolor="green"]\n'+
            'n4 [label="(2)\n'+'return 0;", shape="box", style="filled", fillcolor="green"]\n'+
            'n1 -> n4 []\n'+
            '\n';
        assert.deepEqual(ans, wantedAns);
    });

    it('check graph else if', ()=> {
        let codeToParse = 'function foo(){\n' +
            'if(1==0){\n'+
            'let y=1;}\n'+
            'else if(0==0){\n'+
            'let y=0;}\n'+
            'return y;\n' +
            '}';
        let input = '';
        let parsedCode = parseCode(codeToParse);
        createParseInfo(parsedCode);
        functionAfterSubs(codeToParse,input);
        let ans = createCFG(parsedCode, codeToParse);

        let wantedAns='n1 [label="(1)\n'+'1==0", shape="diamond", style="filled", fillcolor="green"]\n'+
            'n2 [label="(2)\n'+'y=1;", shape="box"]\n'+
            'n3 [label="(3)\n'+'return y;", shape="box", style="filled", fillcolor="green"]\n'+
            'n4 [label="(4)\n'+'0==0", shape="diamond", style="filled", fillcolor="green"]\n'+
            'n5 [label="(5)\n'+'y=0;", shape="box", style="filled", fillcolor="green"]\n'+
            'n1 -> n2 [label="true"]\n'+
            'n1 -> n4 [label="false"]\n'+
            'n2 -> n3 []\n'+
            'n4 -> n5 [label="true"]\n'+
            'n4 -> n3 [label="false"]\n'+
            'n5 -> n3 []\n'+
            '\n';
        assert.deepEqual(ans, wantedAns);
    });
});


/////////////////////////////////part 2


// describe('function with global array', () => {
//
// });
//
// describe('function with arg array-string compare', () => {
//
// });
//
// describe('another function with arg array-string compare', () => {
//     it('another function with arg array-string compare',()=>{
//         let code='function x(a,b){\n' +
//             'if(a[0]=="a" && b==1){\n' +
//             'return "a";\n' +
//             '}\n' +
//             '}';
//         let vars='[\'a\',false],0';
//         let temp=parseCode(code);
//         functionAfterSubs(temp,vars);
//         let ans=newLines.toString();
//         assert.deepEqual('function x(a,b){\n' +
//             '\n' +
//             'if(a [ 0 ]  == "a" && b == 1){\n' +
//             'return "a";\n' +
//             '\n' +
//             '}\n' +
//             '\n' +
//             '}\n',ans);
//     });
//
// });
// it('function with global array', ()=>{
//     let code='let a=[true];\n' +
//         'function x(){\n' +
//         'let b=0;\n' +
//         'if(a[b]){\n' +
//         'return "a";\n' +
//         '}\n' +
//         '}';
//     let vars='';
//     let temp=parseCode(code);
//     functionAfterSubs(temp,vars);
//     // let ans='';
//     // for(let i=0;i<newLines.length;i++){
//     //     ans+=newLines[i]+'\n';
//     // }
//     assert.deepEqual(newLines.toString(),'function x(){\n' +
//         '\n' +
//         'if(a [ 0 ] ){\n' +
//         'return "a";\n' +
//         '\n' +
//         '}\n' +
//         '\n' +
//         '}\n');
// });