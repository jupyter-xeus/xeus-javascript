
// add toplevel variables to global scope
Module["_add_to_global_scope"] = function (ast) {
    let extra_code = [];
    for(const node of ast.body){
        if(node.type == "FunctionDeclaration")
        {
            const  name = node.id.name;
            extra_code.push(`globalThis[\"${name}\"] = ${name};`);
        }
        else if(node.type == "VariableDeclaration")
        {
            const declarations = node.declarations;
            if(declarations.length != 1){
                throw "VariableDeclaration with more than 1 declaration not yet implemented";
            }
            const declaration = declarations[0];
            const declaration_type = declaration.id.type;

            if(declaration_type == "ObjectPattern"){
                // get all the keys
                const keys = declaration.id.properties.map((prop)=>prop.key.name);
                Module["clog"]("ObjectPatternKeys",keys);
                for(const key of keys){
                    extra_code.push(`globalThis[\"${key}\"] = ${key};`);
                }

            }
            else if(declaration_type == "ArrayPattern"){
                // get all the keys
                const keys = declaration.id.elements.map((element)=>element.name);
                Module["clog"]("ArrayPatternKeys",keys);
                for(const key of keys){
                    extra_code.push(`globalThis[\"${key}\"] = ${key};`);
                }
            }
            else if(declaration_type == "Identifier"){

                const  name = node.declarations[0].id.name;
                extra_code.push(`globalThis[\"${name}\"] = ${name};`);
            }
            else{
                throw `unknown VariableDeclaration type ${node.id.type}`;
            }
        }
    }
    return extra_code.join('\n');

}

Module["clog"] = function (...msg) {

    let msg_str = "";
    for (let i = 0; i < msg.length; i++) {
        msg_str += `${msg[i]}`;
        if (i < msg.length - 1) {
            msg_str += " ";
        }
    }
    Module["_stdout"](`${msg_str}\n`);
}


Module["_handle_last_statement"] = function (
    code_user,
    ast
) {


    // is the very last character a semicolon?
    const last_char_is_semicolon =  code_user[code_user.length-1] == ";";

    // get the last node
    const last_node = ast.body[ast.body.length-1];

    // if the last node is an expression statement
    // then we need to add a return statement
    // so that the expression gets returned
    let with_return = false;
    if(!last_char_is_semicolon && last_node.type == "ExpressionStatement" && last_node.expression.type != "AssignmentExpression"){

        const last_node_start = last_node.start;
        const last_node_end = last_node.end;

        //  remove the last node from the code
        const modified_user_code = code_user.substring(0, last_node_start) + code_user.substring(last_node_end);
        const code_of_last_node = code_user.substring(last_node_start, last_node_end);
        const extra_return_code = `return  ${code_of_last_node};`;

        return {
            with_return: true,
            modified_user_code: modified_user_code,
            extra_return_code: extra_return_code
        }
    }
    else
    {
        return {
            with_return: false,
            modified_user_code: code_user,
            extra_return_code: ""
        }
    }

}




Module["_make_async_from_code"] = function (code) {

    if(code.length == 0){
        return {
            async_function: async function(){},
            with_return: false
        };
    }

    const ast = Module["_ast_parse"](code);

    console.dir(ast.body, {depth: null});

    // code to add top level variables to global scope
    const code_add_to_global_scope = Module["_add_to_global_scope"](ast);

    // handle last statement / add return if needed
    let {with_return, modified_user_code, extra_return_code} = Module["_handle_last_statement"](
        code,
        ast
    );


    // handle import statements (in reverse order)
    // so that the line numbers stay correct
    for(let i=ast.body.length-1; i>=0; i--){
        const node = ast.body[i];
        if(node.type == "ImportDeclaration"){
            // most simple case, no specifiers
            if(node.specifiers.length == 0){
                const start = node.start;
                const end = node.end;
                if(node.source.type != "Literal"){
                    throw "import source is not a literal";
                }
                const module_name = node.source.value;
                const new_code_of_node = `importScripts("${module_name}");`;
                modified_user_code = modified_user_code.substring(0, start) + new_code_of_node + modified_user_code.substring(end);
            }
        }
    }

    const combined_code = `
${modified_user_code}
${code_add_to_global_scope}
${extra_return_code}
    `;

    Module["clog"]("combined_code", combined_code);

    let async_function = Function(`const afunc = async function(){

        ${combined_code}

    };
    return afunc;
    `)();
    return {
        async_function: async_function,
        with_return: with_return
    };
}

Module["_ast_parse_options"] = {
    ranges: true,
    module: true,
};

Module["_ast_parse"] = function (code) {
    return globalThis["meriyah"].parseScript(code, Module["_ast_parse_options"]);
}

Module["_configure"] = function () {

    console.log("import meriyah");
    const url="https://cdn.jsdelivr.net/npm/meriyah@4.3.9/dist/meriyah.umd.min.js"
    importScripts(url);



    globalThis.ijs
    globalThis.pprint = function(...args){
        // stringify all with 2 spaces
        // and join with space
        // and add newline at the end

        let msg = ""
        for (let i = 0; i < args.length; i++) {
            msg += `${JSON.stringify(args[i], null, 2)}`;
            if (i < args.length - 1) {
                msg += " ";
            }
        }
        Module["_publish_stdout_stream"](`${msg}\n`);
    }
    // alias
    globalThis.pp = globalThis.pprint;


    console.log = function (... args) {
        let msg = ""
        for (let i = 0; i < args.length; i++) {
            msg += `${args[i]}`;
            if (i < args.length - 1) {
                msg += " ";
            }
        }
        Module["_publish_stdout_stream"](`${msg}\n`);
    }
    console.error = function (... args) {
        let msg = ""
        for (let i = 0; i < args.length; i++) {
            msg += `${args[i]}`;
            if (i < args.length - 1) {
                msg += " ";
            }
        }
        Module["_publish_stderr_stream"](`${msg}\n`);
    }

    // add ijs to global scope
    globalThis["ijs"] = Module["ijs"];
}

Module["_call_user_code"] =  async function (code) {



    try{
        let as
        const ret = Module["_make_async_from_code"](code);
        const async_function = ret.async_function;
        let result = await async_function();
        if(ret.with_return){
            // console.log(result);
            Module["ijs"]["display"]["best_guess"](result);
        }

        return {
            has_error: false
        }
    }
    catch(err){

        // if the error is an integer,  then
        // its a c++ exception ptr
        // so we need to get the error message

        if(typeof err === "number"){
            console.log("catched c++ exception", err);
            let msg = Module["get_exception_message"](err);

            // if promise
            if(msg instanceof Promise){
                console.log("awaiting promise");
                msg = await msg;
            }


            console.log("msg", msg);
            return{
                error_type: "C++ Exception",
                error_message: `${msg}`,
                error_stack: "",
                has_error: true
            }
        }

        return{
            error_type: `${err.name || "UnkwownError"}`,
            error_message: `${err.message || ""}`,
            error_stack: `${err.stack || ""}`,
            has_error: true
        }
    }

}


Module["_complete_line"] = function (code_line){

    // remove unwanted left part:
    // ie if code is " if(postM)" then remove " if("
    // ie if code is " postM" then remove " "
    const stop_chars = " {}()=+-*/%&|^~<>,:;!?@#";
    let code_begin = 0;
    for (let i = code_line.length-1; i >= 0; i--) {
        if(stop_chars.includes(code_line[i])){
            code_begin = i+1;
            break;
        }
    }
    let pseudo_expression = code_line.substring(code_begin);


    // pseudo_expression is "fubar.b" "fubar", "fubar." or "fubar['aaa']"

    // find part right of dot / bracket
    // start searching from the right
    const exp_stop_chars = ".]";

    let split_pos = pseudo_expression.length;
    let found = false;
    for (let i = split_pos-1; i >= 0; i--) {
        if(exp_stop_chars.includes(pseudo_expression[i])){
            split_pos = i;
            found = true;
            break;
        }
    }
    // left part is the root object
    // right part is the expression to complete
    let root_object_str = "";
    let to_match = pseudo_expression;
    let curser_start = code_begin;
    if(found){
        root_object_str = pseudo_expression.substring(0, split_pos);
        to_match = pseudo_expression.substring(split_pos+1);
        curser_start += split_pos+1;
    }



    // find root object
    let root_object = globalThis;
    if(root_object_str != ""){
        try{
            root_object = eval(root_object_str);
        }
        catch(err){
            Module["_publish_stderr_stream"](`${err}\n`);
            return {
                matches : [],
                cursor_start : curser_start,
                status: "error"
            };
        }
    }


    let matches = [];
    // loop over all variables in  global scope
    for (let key in root_object) {
        // check if variable name starts with code
        if (key.startsWith( to_match)) {
            matches.push(key);
        }
    }
    return {
        matches : matches,
        cursor_start : curser_start
    };
}

Module["_complete_request"] = function (code, curser_pos){



    // split code into lines
    let lines = code.split("\n");

    // find line the cursor is on
    let line_index = 0;
    let curser_pos_in_line = 0;
    let line_begin = 0;

    // loop over lines
    for (let i = 0; i < lines.length; i++) {
       if( curser_pos>=line_begin && curser_pos<=line_begin+lines[i].length){
           line_index = i;
           curser_pos_in_line = curser_pos - line_begin;
           break;
        }
        line_begin += lines[i].length+1; // +1 for the \n
    }
    let code_line = lines[line_index];

    // only match if cursor is at the end of the code line
    if(curser_pos_in_line != code_line.length){
        return JSON.stringify({
            matches : [],
            cursor_start : curser_pos,
            cursor_end : curser_pos,
        });
    }

    let line_res = Module["_complete_line"](code_line);
    let matches = line_res.matches;
    let in_line_cursor_start = line_res.cursor_start;

    let return_obj = {
        matches : matches,
        cursor_start : line_begin + in_line_cursor_start,
        cursor_end : curser_pos,
        status: line_res.status || "ok"
    };

    return JSON.stringify(return_obj);

}

Module['ijs'] = {
    display : {
        display: function (data, metadata={}, transient={}) {
            try{
                // json stringify
                str_obj = JSON.stringify({
                    data: data,
                    metadata: metadata,
                    transient: transient
                });
                Module["_display_data"](str_obj);
            }
            catch(err){
                Module["_publish_stderr_stream"](`display error: ${err}\n`);
            }
        },
        mime_type: function (mime_type, data) {
            this.display({ mime_type: data });
        },
        html: function (html) {
            this.display({ "text/html": html });
        },
        text: function (text) {
            try{
                this.display({ "text/plain": `${text}` });
            }
            catch(err){
                Module["_publish_stderr_stream"](`display error: ${err}\n`);
            }
        },
        json: function (json) {
            this.display({ "application/json": json });
        },
        svg: function (svg) {
            this.display({ "image/svg+xml": svg });
        },
        latex: function (latex) {
            this.display({ "text/latex": latex });
        },
        best_guess: function (data) {
            try{
                if(data instanceof String){
                    this.text(data);
                }
                else if(data instanceof Number){
                    this.text(data);
                }
                else if(data instanceof Boolean){
                    this.text(data);
                }
                else if(data instanceof Array){
                    try{
                        this.json(data);
                    }
                    catch(err){
                        this.text(data);
                    }
                }
                else if(data instanceof Object){

                    let fixed_data = { ... data };


                    // if object has "data" field try to display it via the "display" method
                    if(fixed_data.hasOwnProperty("data")){

                        try{
                            this.display(fixed_data,
                                fixed_data.hasOwnProperty("metadata") ? fixed_data.metadata : {},
                                fixed_data.hasOwnProperty("transient") ? fixed_data.transient : {}
                            );
                            return;
                        }
                        catch(err){
                            // just fall through
                        }
                    }

                    try{
                        this.json(fixed_data);
                    }
                    catch(err){
                        this.text(fixed_data);
                    }
                }
                else{
                    try{
                        this.text(data);
                    }
                    catch(err){
                        this.text(data);
                    }
                }
            }
            catch(err){
                Module["_publish_stderr_stream"](`display error: ${err}\n`);
            }
        }
    },
}


// function transform_import_statement_to_dynamic_imports(import_statement){
//     // convert  the following import statements into dynamic imports
//     // import * as name from "module-name";                                             // => const name = await import("module-name");
//     // import { export1 } from "module-name";                                           // => const { export1 } = await import("module-name");
//     // import { export1 as alias1 } from "module-name";                                 // => const { export1: alias1 } = await import("module-name");
//     // import { default as alias } from "module-name";
//     // import { export1, export2 } from "module-name";
//     // import { export1, export2 as alias2, /* … */ } from "module-name";
//     // import { "string name" as alias } from "module-name";
//     // import defaultExport, { export1, /* … */ } from "module-name";
//     // import defaultExport, * as name from "module-name";                              //
//     // import "module-name";                                                            // => await import("module-name");


// }
