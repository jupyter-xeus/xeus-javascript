
let magic_imports = {
    enabled: true,
    base_url: "https://cdn.jsdelivr.net/",
    enable_auto_npm: true
}


function add_to_global_this_code(key, identifier = key) {
    return `globalThis[\"${key}\"] = ${identifier};`
}

function replace_code (code, start, end, new_code) {
    return code.substring(0, start) + new_code + code.substring(end);
}

// add toplevel variables to global scope
function add_to_global_scope(ast) {
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

            // for all decl in the declarations
            for(const declaration of declarations){

                //const declaration = declarations[0];
                const declaration_type = declaration.id.type;

                if(declaration_type == "ObjectPattern"){


                    // manual loop
                    for(const prop of declaration.id.properties){
                        const key = prop.key.name;

                        // in cases like const { default: defaultExport } = await import(url);
                        if(key == "default"){
                            // get the value
                            if(!prop.value.type == "Identifier"){
                                throw new Error("default value is not an identifier");
                            }
                            const value = prop.value.name;
                            extra_code.push(add_to_global_this_code(prop.value.name));
                        }
                        // cases like const { a,b } = { a: 1, b: 2 , c: 3}
                        else{
                            // extra_code.push(`globalThis[\"${key}\"] = ${key};`);
                            extra_code.push(add_to_global_this_code(key));
                        }
                    }

                }
                else if(declaration_type == "ArrayPattern"){
                    // get all the keys
                    const keys = declaration.id.elements.map((element)=>element.name);
                    for(const key of keys){
                        extra_code.push(add_to_global_this_code(key));
                    }
                }
                else if(declaration_type == "Identifier"){
                    extra_code.push(add_to_global_this_code(declaration.id.name));
                }
                else{
                    throw new Error(`unknown VariableDeclaration type ${node.id.type}`);
                }
            }
        }
    }
    return extra_code.join('\n');

}


function handle_last_statement(
    code_user,
    ast
) {

    // get the last node
    const last_node = ast.body[ast.body.length-1];


    // if the last node is an expression statement
    // then we need to add a return statement
    // so that the expression gets returned
    if(last_node.type == "ExpressionStatement" && last_node.expression.type != "AssignmentExpression"){

        const last_node_expr_start = last_node.expression.start;
        const last_node_expr_end = last_node.expression.end;

        // "rest"
        const last_node_rest_end = last_node.end
        // search between last_node_expr_end and last_node_rest_end for a semicolon
        // if there is a semicolon then we dont need to add a return

        let semicolon_found = false;
        for(let i=last_node_expr_end; i<last_node_rest_end; i++){
            if(code_user[i] == ";"){
                semicolon_found = true;
                break;
            }
        }

        if(!semicolon_found){
            //  remove the last node from the code
            const modified_user_code = code_user.substring(0, last_node_expr_start) + code_user.substring(last_node_expr_end);
            const code_of_last_node = code_user.substring(last_node_expr_start, last_node_expr_end);


            const extra_return_code = `return [${code_of_last_node}];`;


            return {
                with_return: true,
                modified_user_code: modified_user_code,
                extra_return_code: extra_return_code
            }
        }
    }

    return {
        with_return: false,
        modified_user_code: code_user,
        extra_return_code: ""
    }


}

function transform_import_source (source) {
    const no_magic_starts = ['http://', 'https://', 'data:', 'file://', 'blob:'];
    const no_ems_ends = ['.js', '.mjs', '.cjs', '.wasm', "+esm"];

    if(magic_imports.enabled){

        const base_url = magic_imports.base_url.endsWith("/") ? magic_imports.base_url : magic_imports.base_url+"/";


        const add_ems = !no_ems_ends.some((end)=>source.endsWith(end));
        let ems_extra_end = add_ems ? source.endsWith("/") ? "+esm" : "/+esm" : "";
        // if the source starts with http or https we dont do anything
        if(no_magic_starts.some((start)=>source.startsWith(start))){
            return source;
        }
        else{
            if(["npm/","gh/"].some((start)=>source.startsWith(start)) || !magic_imports.enable_auto_npm){
                return `${base_url}${source}${ems_extra_end}`;
            }
            else{
                return `${base_url}npm/${source}${ems_extra_end}`;
            }
        }
    }
    return source;
}

function rewrite_import_statements(code, ast)
{
    let modified_user_code = code;
    let code_add_to_global_scope = "";
    // handle import statements (in reverse order)
    // so that the line numbers stay correct
    for(let i=ast.body.length-1; i>=0; i--){
        const node = ast.body[i];
        if(node.type == "ImportDeclaration"){

            const import_source = transform_import_source(node.source.value);

            if(node.specifiers.length == 0){
                if(node.source.type != "Literal"){
                    throw Error("import source is not a literal");
                }
                modified_user_code = replace_code(modified_user_code,
                    node.start, node.end, `await import("${import_source}");\n`);
            }
            else{

                let has_default_import = false;
                let default_import_name = "";

                let has_namespace_import = false;
                let namespace_import_name = "";

                let imported_names = [];
                let local_names = [];

                // get imported and local names
                for(const specifier of node.specifiers){
                    if(specifier.type == "ImportSpecifier"){
                        if(specifier.imported.name == "default"){
                            has_default_import = true;
                            default_import_name = specifier.local.name;
                        }
                        else{
                            imported_names.push(specifier.imported.name);
                            local_names.push(specifier.local.name);
                        }
                    }
                    else if(specifier.type == "ImportDefaultSpecifier"){
                        has_default_import = true;
                        default_import_name = specifier.local.name;
                    }
                    else if(specifier.type == "ImportNamespaceSpecifier"){
                        has_namespace_import = true;
                        namespace_import_name = specifier.local.name;

                    }
                    else{
                        throw Error(`unknown specifier type ${specifier.type}`);
                    }
                }

                let new_code_of_node = "";
                if(has_default_import){
                    new_code_of_node += `const { default: ${default_import_name} } = await import("${import_source}");\n`;
                    code_add_to_global_scope += add_to_global_this_code(default_import_name);
                }

                if(has_namespace_import){
                    new_code_of_node += `const ${namespace_import_name} = await import("${import_source}");\n`;
                    code_add_to_global_scope += add_to_global_this_code(namespace_import_name);
                }


                if(imported_names.length > 0){
                    new_code_of_node += `const { `;
                    for(let i=0; i<imported_names.length; i++){
                        new_code_of_node += imported_names[i];
                        code_add_to_global_scope += add_to_global_this_code(local_names[i], imported_names[i]);
                        if(i<imported_names.length-1){
                            new_code_of_node += ", ";
                        }
                    }
                    new_code_of_node += `} = await import("${import_source}");\n`;
                }

                modified_user_code =replace_code(modified_user_code,    node.start, node.end, new_code_of_node);

            }


        }
    }
    return {
        modified_user_code: modified_user_code,
        code_add_to_global_scope: code_add_to_global_scope
    };
}


function make_async_from_code(code) {

    if(code.length == 0){
        return {
            async_function: async function(){},
            with_return: false
        };
    }


    const ast = globalThis["meriyah"].parseScript(code, {
        ranges: true,
        module: true,
    });


    // code to add top level variables to global scope
    let code_add_to_global_scope = add_to_global_scope(ast);

    // handle last statement / add return if needed
    let {with_return, modified_user_code, extra_return_code} = handle_last_statement(
        code,
        ast
    );


    // handle import statements
    const res = rewrite_import_statements(modified_user_code, ast);
    modified_user_code = res.modified_user_code;
    code_add_to_global_scope += res.code_add_to_global_scope;

    const combined_code = `
    ${modified_user_code}
    ${code_add_to_global_scope}
    ${extra_return_code}
    `;

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


function _configure() {





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
        Module.interpreter.publish_stream("stdout", `${msg}\n`);
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
        Module.interpreter.publish_stream("stdout", `${msg}\n`);
    }
    console.error = function (... args) {
        let msg = ""
        for (let i = 0; i < args.length; i++) {
            msg += `${args[i]}`;
            if (i < args.length - 1) {
                msg += " ";
            }
        }
        Module.interpreter.publish_stream("stderr", `${msg}\n`);
    }

    // add ijs to global scope
    globalThis["ijs"] = Module["ijs"];

    Module.interpreter = Module._get_interpreter();

}

Module.get_request_context = function () {
    return Module._xrequest_context;
}

Module.get_interpreter = function () {
    return Module.interpreter;
}


async function _call_user_code(execution_counter, config, reply_callback, code) {


    try{

        const ret = make_async_from_code(code);
        const async_function = ret.async_function;

        let result_promise = async_function();

        let data = {};

        if(ret.with_return){
            let result_holder = await result_promise;
            let result = result_holder[0];
            data = Module["ijs"]["get_mime_bundle"](result);
            if(!config.silent){
                Module.get_interpreter().publish_execution_result(execution_counter, data, {});
            }
        }
        else{
            await result_promise;
        }
        reply_callback.reply_success();
    }
    catch(err){

        // if the error is an integer,  then
        // its a c++ exception ptr
        // so we need to get the error message

        if(typeof err === "number"){
            let msg = Module["get_exception_message"](err);

            // if promise
            if(msg instanceof Promise){
                msg = await msg;
            }
            Module.get_interpreter().publish_execution_error("C++ Exception", `${msg}`, "");
            reply_callback.reply_error("C++ Exception", `${msg}`, "");
        }
        else{
            // remove a bunch of noise from the stack
            let err_stack_str = `${err.stack || ""}`;
            let err_stack_lines = err_stack_str.split("\n");
            let used_lines = [];
            for(const line of err_stack_lines){
                if(line.includes("make_async_from_code ")){
                    break;
                }
                used_lines.push(line);
            }
            err_stack_str = used_lines.join("\n");
            Module.get_interpreter().publish_execution_error(`${err.name || "UnkwownError"}`, `${err.message || ""}`, `${err_stack_str}`);
            reply_callback.reply_error(`${err.name || "UnkwownError"}`, `${err.message || ""}`, `${err_stack_str}`);
        }
    }
    finally{
        config.delete();
        reply_callback.delete();
    }

}


function complete_line(code_line){

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

function _complete_request(code, curser_pos){



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
        return {
            matches : [],
            cursor_start : curser_pos,
            cursor_end : curser_pos,
        };
    }

    let line_res = complete_line(code_line);
    let matches = line_res.matches;
    let in_line_cursor_start = line_res.cursor_start;

    return {
        matches : matches,
        cursor_start : line_begin + in_line_cursor_start,
        cursor_end : curser_pos,
        status: line_res.status || "ok"
    };

}

let ijs = {
    magic_imports: magic_imports,
    display : {
        display: function (data, metadata={}, transient={}) {
            Module.get_interpreter().display_data(data, metadata, transient);
        },
        update_display_data: function (data, metadata={}, transient={}) {
            Module.get_interpreter().update_display_data(data, metadata, transient);
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
                Module.interpreter.publish_stream("stderr", `display error: ${err}\n`);
            }
        }


    },
    get_mime_bundle: function (to_display) {
        if(to_display instanceof String){
            return { "text/plain": `${to_display}` };
        }
        else if(to_display instanceof Number){
            return { "text/plain": `${to_display}` };
        }
        else if(to_display instanceof Boolean){
            return { "text/plain": `${to_display}` };
        }
        else if(to_display instanceof Array){
            return { "application/json": to_display };
        }
        else if(to_display instanceof Object){
            return { "application/json": to_display };
        }
        else{
            return { "text/plain": to_display };
        }
    }
}

async function async_init( kernel_root_url, pkg_root_url, verbose){
    Module._com_manager = new Module.CommManager();
}



Module.async_init = async_init;

Module._configure = _configure;
Module._call_user_code = _call_user_code;
Module._complete_request = _complete_request;

Module.FS = FS;
Module.ijs = ijs;


function get_comm_manager(){
    return Module._com_manager;
}
Module.get_comm_manager = get_comm_manager;
