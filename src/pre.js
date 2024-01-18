Module["_make_async_from_code"] = function (code) {

    let async_function = Function(`
        const afunc = async function(){
            ${code}
        }
        return afunc;
    `)();
    return async_function;
}

Module["_configure"] = function () {
    console.log = function (... args) {
        let msg = ""
        for (let i = 0; i < args.length; i++) {
            msg += `${args[i]} `;
        }
        Module["publish_stdout_stream"](`${msg}\n`);
    }
    console.error = function (... args) {
        let msg = ""
        for (let i = 0; i < args.length; i++) {
            msg += `${args[i]} `;
        }
        Module["publish_stderr_stream"](`${msg}\n`);
    }
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
        return{
            error_type: `${err.name || "UnkwownError"}`,
            error_message: `${err.message || ""}`,
            error_stack: `${err.stack || ""}`,
            has_error: true
        }
    }
}