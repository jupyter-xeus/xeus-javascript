Module["_make_async_from_code"] = function (code) {

    try{
    var code_ast = Module["_ast_parse"](code);
    }
    catch(err){
        console.log("error parsing code", err);
        throw err;
    }
    let extra_code = [];
    for(const node of code_ast.body){
        if(node.type == "FunctionDeclaration")
        {
            const  name = node.id.name;
            extra_code.push(`globalThis[\"${name}\"] = ${name};`);
        }
        else if(node.type == "VariableDeclaration")
        {
            const  name = node.declarations[0].id.name;
            extra_code.push(`globalThis[\"${name}\"] = ${name};`);
        }
    }
    const ec = extra_code.join('\n');
    const total_code =  code.concat('\n', ec);

    //console.log("total_code", total_code);


    let async_function = Function(`const afunc = async function(){
        ${total_code}
    };
    return afunc;
    `)();
    return async_function;
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
        const async_function =  Module["_make_async_from_code"](code);
        await async_function();
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
    _clog("_complete_request", code, curser_pos);


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
        _display: function (data, metadata={}, transient={}) {
            // json stringify
            str_obj = JSON.stringify({
                data: data,
                metadata: metadata,
                transient: transient
            });
            Module["_display_data"](str_obj);
        },
        mime_type: function (mime_type, data) {
            this._display({ mime_type: data });
        },
        html: function (html) {
            this._display({ "text/html": html });
        },
        text: function (text) {
            this._display({ "text/plain": text });
        },
        json: function (json) {
            this._display({ "application/json": json });
        },
        svg: function (svg) {
            this._display({ "image/svg+xml": svg });
        },
        latex: function (latex) {
            this._display({ "text/latex": latex });
        }
    },
}
